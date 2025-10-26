# to start the server: uvicorn main:app --reload

from typing import Dict, Any
import uuid
import asyncio
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part
from google.adk.runners import Runner
from pydantic import BaseModel

# WebSocket imports (organized)
from websocket.manager import websocket_manager
from websocket.publisher import websocket_publisher

from transaction_agent.agent import root_agent
from chat_agent.agent import create_user_agent
from financial_summary import generate_financial_summary, store_summary, get_latest_summary, should_regenerate_summary

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session service for ADK
session_service = InMemorySessionService()

class TransactionRequest(BaseModel):
    user_id: str
    transaction: Dict[str, Any]

class TransactionResponse(BaseModel):
    status: str
    run_id: str
    insights_id: str | None = None
    message: str

class ChatRequest(BaseModel):
    user_id: str
    message: str
    session_id: str | None = None

class ChatResponse(BaseModel):
    status: str
    message: str
    charts: list[Dict[str, Any]] = []
    session_id: str
    timestamp: str

class FinancialSummaryRequest(BaseModel):
    user_id: str
    period_days: int = 30
    force_refresh: bool = False

class FinancialSummaryResponse(BaseModel):
    status: str
    summary_id: str | None = None
    summary: Dict[str, Any] | None = None
    message: str
    generated_at: str

@app.post("/api/transaction/analyze", response_model=TransactionResponse)
async def analyze_transaction(request: TransactionRequest):
    f"""
    Analyze a transaction using the multi-agent pipeline

    Expected transaction format:
    {
        "plaid_transaction_id": "unique_id",
        "amount": 25.50,
        "merchant_name": "Starbucks",
        "description": "Purchase at Starbucks",
        "posted_at": "2024-01-15",
        "category": "Food and Drink",
        "account_id": "uuid",
        "location_city": "San Francisco",
        "location_state": "CA",
        "raw": {...}, # raw transaction data
    }
    """

    try:
        # Generate unique session ID for this analysis
        session_id = str(uuid.uuid4())
        app_name = "transaction_analyzer"

        # Create session (using await for async consistency)
        session = await session_service.create_session(
            app_name=app_name,
            user_id=request.user_id,
            session_id=session_id,
        )

        # Set incoming transaction in session state using Event/EventActions
        from google.adk.events import Event, EventActions
        init_event = Event(
            author="api",
            invocation_id=f"init_{session_id}",
            content=Content(parts=[Part(text="Transaction analysis started")]),
            actions=EventActions(state_delta={
                "incoming_transaction": request.transaction,
                "user_id": request.user_id,
                "session_id": session_id
            })
        )
        await session_service.append_event(session, init_event)

        # Create runner and execute pipeline
        runner = Runner(
            agent=root_agent,
            app_name=app_name,
            session_service=session_service
        )

        # Run the agent pipeline
        events = []
        for event in runner.run(
            user_id=request.user_id,
            session_id=session_id,
            new_message=Content(parts=[Part(text="Analyze transaction")])
        ):
            events.append(event)
            if event.is_final_response():
                break

        # Extract results from the session object we already have
        run_id = session.state.get("run_id", session_id)
        insights_id = session.state.get("insights_id")

        return TransactionResponse(
            status="success",
            run_id=run_id,
            insights_id=insights_id,
            message="Transaction analysis completed successfully"
        )
    except Exception as e:
        return TransactionResponse(
            status="error",
            message=f"Analysis failed: {str(e)}"
        )

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    """
    Chat with the financial AI agent
    
    Expected request format:
    {
        "user_id": "uuid",
        "message": "Show my cashflow runway for the next 60 days",
        "session_id": "optional_session_id"
    }
    """
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        app_name = "financial_chat"
        
        # Create session (using await for async consistency)
        session = await session_service.create_session(
            app_name=app_name,
            user_id=request.user_id,
            session_id=session_id,
        )
        
        # Set chat message in session state using Event/EventActions
        from google.adk.events import Event, EventActions
        init_event = Event(
            author="user",
            invocation_id=f"chat_{session_id}",
            content=Content(parts=[Part(text=request.message)]),
            actions=EventActions(state_delta={
                "user_message": request.message,
                "user_id": request.user_id,
                "session_id": session_id
            })
        )
        await session_service.append_event(session, init_event)
        
        # Create user-specific agent with security context
        # This ensures the agent can ONLY access this user's data
        user_agent = create_user_agent(request.user_id)
        
        # Create runner and execute chat agent
        # The runner will automatically load conversation history from session_id
        runner = Runner(
            agent=user_agent,
            app_name=app_name,
            session_service=session_service
        )
        
        # Run the chat agent with session context
        # ADK automatically loads previous messages from this session_id
        events = []
        final_event = None
        for event in runner.run(
            user_id=request.user_id,
            session_id=session_id,  # This enables conversation memory
            new_message=Content(parts=[Part(text=request.message)])
        ):
            events.append(event)
            if event.is_final_response():
                final_event = event
                break
        
        # Extract response and charts from ALL events
        agent_response = "I'm sorry, I couldn't process your request."
        charts = []
        
        # Parse all events to extract text and charts
        for event in events:
            if event.content and event.content.parts:
                for part in event.content.parts:
                    # Extract text response (prioritize final event's text)
                    if hasattr(part, 'text') and part.text:
                        if event.is_final_response() or not agent_response or agent_response == "I'm sorry, I couldn't process your request.":
                            agent_response = part.text
                    
                    # Extract function call results (charts from visualization tools)
                    if hasattr(part, 'function_response') and part.function_response:
                        try:
                            func_result = part.function_response
                            if hasattr(func_result, 'response') and func_result.response:
                                result_data = func_result.response
                                # Check if this is a chart result
                                if isinstance(result_data, dict) and result_data.get('chart_type'):
                                    charts.append(result_data)
                        except Exception as e:
                            print(f"[CHART] Error extracting chart: {e}")
        
        print(f"[CHAT] Extracted {len(charts)} chart(s) from tool calls")
        
        return ChatResponse(
            status="success",
            message=agent_response,
            charts=charts,
            session_id=session_id,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        return ChatResponse(
            status="error",
            message=f"Chat failed: {str(e)}",
            charts=[],
            session_id=request.session_id or str(uuid.uuid4()),
            timestamp=datetime.now().isoformat()
        )

@app.post("/api/financial-summary/generate", response_model=FinancialSummaryResponse)
async def generate_and_store_financial_summary(request: FinancialSummaryRequest):
    """
    Generate and store a comprehensive financial summary.
    
    Called on user login to generate a complete financial overview.
    Returns cached summary if available and fresh (< 6 hours old).
    
    Expected request format:
    {
        "user_id": "uuid",
        "period_days": 30  # Optional, defaults to 30
    }
    """
    try:
        # Check if we should regenerate (summary doesn't exist or is stale)
        should_regenerate = await should_regenerate_summary(request.user_id, max_age_hours=6)
        
        # Force refresh if requested
        if request.force_refresh:
            should_regenerate = True
        
        if not should_regenerate:
            # Return cached summary
            cached_summary = await get_latest_summary(request.user_id)
            if cached_summary:
                return FinancialSummaryResponse(
                    status="success",
                    summary_id=cached_summary["id"],
                    summary=cached_summary.get("summary_data"),
                    message="Returning cached summary",
                    generated_at=cached_summary.get("created_at", datetime.now().isoformat())
                )
        
        # Generate new summary
        result = await generate_financial_summary(request.user_id, request.period_days)
        
        if not result.get("success"):
            return FinancialSummaryResponse(
                status="error",
                summary_id=None,
                summary=None,
                message=f"Failed to generate summary: {result.get('error')}",
                generated_at=datetime.now().isoformat()
            )
        
        summary_data = result.get("summary")
        
        # Store in database
        store_result = await store_summary(request.user_id, summary_data)
        
        if store_result.get("success"):
            return FinancialSummaryResponse(
                status="success",
                summary_id=store_result.get("summary_id"),
                summary=summary_data,
                message="Summary generated and stored successfully",
                generated_at=summary_data.get("period", {}).get("generated_at", datetime.now().isoformat())
            )
        elif store_result.get("already_exists"):
            # Summary already exists for this period, return it
            cached_summary = await get_latest_summary(request.user_id)
            return FinancialSummaryResponse(
                status="success",
                summary_id=cached_summary["id"] if cached_summary else None,
                summary=summary_data,
                message="Summary generated (already existed in database)",
                generated_at=summary_data.get("period", {}).get("generated_at", datetime.now().isoformat())
            )
        else:
            return FinancialSummaryResponse(
                status="partial",
                summary_id=None,
                summary=summary_data,
                message=f"Generated but storage failed: {store_result.get('error')}",
                generated_at=summary_data.get("period", {}).get("generated_at", datetime.now().isoformat())
            )
            
    except Exception as e:
        return FinancialSummaryResponse(
            status="error",
            summary_id=None,
            summary=None,
            message=f"Summary generation failed: {str(e)}",
            generated_at=datetime.now().isoformat()
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "services": {
            "transaction-analyzer": "active",
            "financial-chat": "active",
            "financial-summary": "active"
        },
        "version": "1.0.0"
    }

@app.websocket("/ws/transaction/analyze")
async def websocket_analyze_transaction(websocket: WebSocket):
    """WebSocket endpoint for real-time transaction analysis"""
    print("[WS] WebSocket connection attempt")
    user_id = None
    session_id = None
    
    try:
        await websocket.accept()
        print("[WS] WebSocket accepted, waiting for initial message...")
        
        # Wait for initial message with user_id and transaction data
        initial_data = await websocket.receive_json()
        print(f"[WS] Received initial data: {initial_data}")
        user_id = initial_data.get("user_id")
        transaction_data = initial_data.get("transaction")
        print(f"[WS] Extracted user_id: {user_id}, transaction: {transaction_data}")
        
        if not user_id or not transaction_data:
            await websocket.send_json({
                "type": "error",
                "timestamp": datetime.now().isoformat(),
                "data": {"message": "Missing user_id or transaction data"}
            })
            return
        
        # Connect to WebSocket manager
        await websocket_manager.connect(websocket, user_id)
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Register session
        print(f"[WS] Registering session: {session_id}")
        websocket_manager.register_session(session_id, user_id, transaction_data)
        
        # Send analysis started message
        print(f"[WS] Sending analysis_started message")
        await websocket.send_json({
            "type": "analysis_started",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "session_id": session_id,
                "message": "Transaction analysis started"
            }
        })
        print(f"[WS] Calling run_agent_pipeline_with_websocket...")
        
        # Run the agent pipeline with WebSocket integration
        await run_agent_pipeline_with_websocket(session_id, user_id, transaction_data)
        
        print(f"[WS] Pipeline completed for session: {session_id}")
        
    except WebSocketDisconnect:
        if user_id:
            websocket_manager.disconnect(websocket, user_id)
    except Exception as e:
        if session_id:
            await websocket_publisher.publish_error(session_id, str(e))
        if user_id:
            websocket_manager.disconnect(websocket, user_id)

@app.websocket("/ws/chat/{user_id}")
async def websocket_chat_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time chat with financial AI agent"""
    print(f"[WS CHAT] WebSocket chat connection attempt for user: {user_id}")
    session_id = None
    
    try:
        await websocket.accept()
        print(f"[WS CHAT] WebSocket accepted for user: {user_id}")
        
        # Connect to WebSocket manager
        await websocket_manager.connect(websocket, user_id)
        
        # Send welcome message
        await websocket.send_json({
            "type": "chat_connected",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "user_id": user_id,
                "message": "Connected to FinFlow AI. How can I help you with your finances today?"
            }
        })
        
        # Listen for chat messages
        while True:
            try:
                # Receive chat message from client
                data = await websocket.receive_json()
                message = data.get("message", "").strip()
                
                if not message:
                    await websocket.send_json({
                        "type": "error",
                        "timestamp": datetime.now().isoformat(),
                        "data": {"message": "Please provide a message"}
                    })
                    continue
                
                print(f"[WS CHAT] Received message from {user_id}: {message}")
                
                # Generate session ID for this chat
                session_id = str(uuid.uuid4())
                
                # Send thinking indicator
                await websocket.send_json({
                    "type": "agent_thinking",
                    "timestamp": datetime.now().isoformat(),
                    "data": {
                        "message": "FinFlow AI is thinking...",
                        "session_id": session_id
                    }
                })
                
                # Process with chat agent
                await run_chat_agent_with_websocket(websocket, session_id, user_id, message)
                
            except WebSocketDisconnect:
                print(f"[WS CHAT] Client disconnected: {user_id}")
                break
            except Exception as e:
                print(f"[WS CHAT] Error processing message: {e}")
                await websocket.send_json({
                    "type": "error",
                    "timestamp": datetime.now().isoformat(),
                    "data": {
                        "message": f"Error processing your message: {str(e)}",
                        "session_id": session_id
                    }
                })
                
    except WebSocketDisconnect:
        print(f"[WS CHAT] WebSocket disconnected for user: {user_id}")
        websocket_manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"[WS CHAT] WebSocket error for user {user_id}: {e}")
        websocket_manager.disconnect(websocket, user_id)

async def run_chat_agent_with_websocket(websocket: WebSocket, session_id: str, user_id: str, message: str):
    """Run the chat agent with WebSocket streaming"""
    print(f"[WS CHAT DEBUG] Starting chat agent for session {session_id}")
    
    try:
        app_name = "financial_chat"
        
        # Create session
        session = await session_service.create_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id,
        )
        
        # Set chat message in session state
        from google.adk.events import Event, EventActions
        init_event = Event(
            author="user",
            invocation_id=f"chat_{session_id}",
            content=Content(parts=[Part(text=message)]),
            actions=EventActions(state_delta={
                "user_message": message,
                "user_id": user_id,
                "session_id": session_id
            })
        )
        await session_service.append_event(session, init_event)
        
        # Create runner
        runner = Runner(
            agent=chat_agent,
            app_name=app_name,
            session_service=session_service
        )
        
        # Track if we've sent the final response
        final_response_sent = False
        
        # Run chat agent and stream responses
        for event in runner.run(
            user_id=user_id,
            session_id=session_id,
            new_message=Content(parts=[Part(text=message)])
        ):
            # Manually apply state_delta to session
            if hasattr(event, 'actions') and event.actions and hasattr(event.actions, 'state_delta'):
                state_delta = event.actions.state_delta
                for key, value in state_delta.items():
                    session.state[key] = value
            
            # Send intermediate updates for tool usage
            if hasattr(event, 'actions') and event.actions and hasattr(event.actions, 'state_delta'):
                state_delta = event.actions.state_delta
                
                # Check if agent is using tools
                if "tool_calls" in state_delta:
                    tool_calls = state_delta["tool_calls"]
                    for tool_call in tool_calls:
                        await websocket.send_json({
                            "type": "tool_usage",
                            "timestamp": datetime.now().isoformat(),
                            "data": {
                                "tool_name": tool_call.get("name", "Unknown"),
                                "message": f"Using {tool_call.get('name', 'tool')}...",
                                "session_id": session_id
                            }
                        })
                
                # Check if charts are being generated
                if "charts" in state_delta:
                    charts = state_delta["charts"]
                    if charts:
                        await websocket.send_json({
                            "type": "chart_progress",
                            "timestamp": datetime.now().isoformat(),
                            "data": {
                                "message": f"Generating {len(charts)} chart(s)...",
                                "charts_count": len(charts),
                                "session_id": session_id
                            }
                        })
            
            # Send final response
            if event.is_final_response() and not final_response_sent:
                final_response_sent = True
                
                # Extract final results
                agent_response = session.state.get("agent_response", "I'm sorry, I couldn't process your request.")
                charts = session.state.get("charts", [])
                
                # Send final chat response
                await websocket.send_json({
                    "type": "chat_response",
                    "timestamp": datetime.now().isoformat(),
                    "data": {
                        "message": agent_response,
                        "charts": charts,
                        "session_id": session_id,
                        "charts_count": len(charts)
                    }
                })
                
                print(f"[WS CHAT DEBUG] Sent final response with {len(charts)} charts")
                break
        
    except Exception as e:
        print(f"[WS CHAT ERROR] Chat agent error: {e}")
        import traceback
        traceback.print_exc()
        
        await websocket.send_json({
            "type": "error",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "message": f"Sorry, I encountered an error: {str(e)}",
                "session_id": session_id
            }
        })

async def run_agent_pipeline_with_websocket(session_id: str, user_id: str, transaction_data: Dict[str, Any]):
    """Run the agent pipeline with WebSocket event publishing"""
    print(f"[WS DEBUG] Starting pipeline for session {session_id}")
    print(f"[WS DEBUG] Transaction data: {transaction_data}")
    try:
        app_name = "agents"
        
        print(f"[WS DEBUG] Creating session...")
        # Create session (async in this ADK version)
        try:
            session = await session_service.create_session(
                app_name=app_name,
                user_id=user_id,
                session_id=session_id,
            )
            print(f"[WS DEBUG] Session created: {session_id}")
        except Exception as e:
            print(f"[WS ERROR] Failed to create session: {e}")
            raise
        
        # Set initial state
        try:
            from google.adk.events import Event, EventActions
            init_event = Event(
                author="api",
                invocation_id=f"init_{session_id}",
                content=Content(parts=[Part(text="Transaction analysis started")]),
                actions=EventActions(state_delta={
                    "incoming_transaction": transaction_data,
                    "user_id": user_id,
                    "session_id": session_id
                })
            )
            await session_service.append_event(session, init_event)
            print(f"[WS DEBUG] Initial state set")
        except Exception as e:
            print(f"[WS ERROR] Failed to set initial state: {e}")
            raise
        
        # Create runner
        print(f"[WS DEBUG] Creating runner...")
        runner = Runner(
            agent=root_agent,
            app_name=app_name,
            session_service=session_service
        )
        print(f"[WS DEBUG] Runner created")
        
        # Track target agents for streaming
        target_agents = {
            "categorization_agent",
            "fraud_agent", 
            "budget_agent",
            "cashflow_agent",
            "synthesizer_agent"
        }
        
        # Track which agents have started (to only publish agent_started once per agent)
        agents_started = set()
        # Track which agents have already published completed events (to avoid duplicates)
        agents_completed_published = set()
        
        print(f"[WS DEBUG] Starting runner.run()...")
        # Run pipeline and publish events
        for event in runner.run(
            user_id=user_id,
            session_id=session_id,
            new_message=Content(parts=[Part(text="Analyze transaction")])
        ):
            # Debug logging with more details
            print(f"[WS DEBUG] Event: author={event.author}, is_final={event.is_final_response()}, has_state_delta={hasattr(event, 'actions') and event.actions and hasattr(event.actions, 'state_delta')}")
            
            # Manually apply state_delta to session FIRST (before any publishing)
            if hasattr(event, 'actions') and event.actions and hasattr(event.actions, 'state_delta'):
                state_delta = event.actions.state_delta
                print(f"[WS DEBUG] Event has state_delta: {list(state_delta.keys())}")
                # Manually update session state
                for key, value in state_delta.items():
                    session.state[key] = value
                print(f"[WS DEBUG] Applied state_delta to session. Session now has: {list(session.state.keys())}")
            
            # Publish agent started events (only once per agent)
            if event.author in target_agents and event.author not in agents_started:
                agents_started.add(event.author)
                print(f"[WS DEBUG] Publishing agent_started for {event.author}")
                await websocket_publisher.publish_agent_started(session_id, event.author)
            
            # Publish agent completed events (when agent finishes) - check BOTH is_final_response AND if state_delta contains result
            # This allows us to publish as soon as an agent completes within the parallel group, not waiting for all parallel agents
            if event.author in target_agents and event.author not in agents_completed_published:
                # Check if this event contains the agent's result in state_delta
                should_publish = False
                
                if event.is_final_response():
                    # Always publish on final response
                    should_publish = True
                    print(f"[WS DEBUG] Publishing {event.author} (final response)")
                elif hasattr(event, 'actions') and event.actions and hasattr(event.actions, 'state_delta'):
                    # Check if state_delta contains this agent's result
                    state_delta = event.actions.state_delta
                    result_keys = {
                        "categorization_agent": "categorization_result",
                        "fraud_agent": "fraud_result",
                        "budget_agent": "budget_result",
                        "cashflow_agent": "cashflow_result",
                        "synthesizer_agent": "final_insight"
                    }
                    
                    expected_key = result_keys.get(event.author)
                    if expected_key and expected_key in state_delta:
                        should_publish = True
                        print(f"[WS DEBUG] Publishing {event.author} (has {expected_key} in state_delta)")
                
                if should_publish:
                    print(f"[WS DEBUG] Publishing agent_completed for {event.author}")
                    print(f"[WS DEBUG] Current session state: {list(session.state.keys())}")
                    
                    # Mark as published to avoid duplicates
                    agents_completed_published.add(event.author)
                    
                    # Use the session object with manually updated state
                    await websocket_publisher.publish_agent_completed(
                        session_id, 
                        event.author, 
                        session.state
                    )
            
            # Handle pipeline completion
            if event.is_final_response() and event.author == "database_agent":
                print(f"[WS DEBUG] Publishing analysis_complete")
                # Use the session object we already have
                final_result = {
                    "run_id": session.state.get("run_id"),
                    "insights_id": session.state.get("insights_id"),
                    "database_result": session.state.get("database_result")
                }
                await websocket_publisher.publish_analysis_complete(session_id, final_result)
                break
        
    except Exception as e:
        print(f"[WS ERROR] Pipeline error: {e}")
        import traceback
        traceback.print_exc()
        await websocket_publisher.publish_error(session_id, str(e))
        raise

@app.post("/")
async def root():
    return {"message": "Transaction Analysis API", "version": "1.0.0"}