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

        # Create session
        session = session_service.create_session(
            app_name=app_name,
            user_id=request.user_id,
            session_id=session_id,
        )

        # Set incoming transaction in session state
        session_service.append_event(
            session,
            session_service.create_event(
                invocation_id=f"init_{session_id}",
                author="api",
                content=Content(parts=[Part(text="Transaction analysis started")]),
                actions={"state_delta": {
                    "incoming_transaction": request.transaction,
                    "user_id": request.user_id,
                    "session_id": session_id
                }}
            )
        )

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

        # Extract results from final session state
        final_session = session_service.get_session(app_name, request.user_id, session_id)
        run_id = final_session.state.get("run_id", session_id)
        insights_id = final_session.state.get("insights_id")

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

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "transaction-analyzer"}

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