# to start the server: uvicorn main:app --reload

from typing import Dict, Any
import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part
from google.adk.runners import Runner
from pydantic import BaseModel

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

@app.post("/")
async def root():
    return {"message": "Transaction Analysis API", "version": "1.0.0"}