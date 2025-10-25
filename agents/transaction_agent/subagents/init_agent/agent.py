"""
Transaction Analysis Initialization Agent

Handles the initial setup and context preparation for transaction analysis.
Performs critical preprocessing tasks:
- Checks for transaction deduplication to avoid duplicate processing
- Creates agent run records in Supabase for tracking and audit trails
- Loads user-specific context data (category rules, recent transactions, accounts)
- Calculates baseline spending statistics for comparison
- Packages all context data into session state for downstream agents

Essential first step that ensures data integrity and provides necessary context
for all subsequent analysis agents in the pipeline.
"""

from typing import AsyncGenerator
import uuid
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part
from ...tools.database import (
    check_transaction_exists_async,
    create_agent_run_async,
    fetch_user_context_parallel
)

from ...config import AGENT_MODES, AGENT_STATUS

class InitAgent(BaseAgent):
    """
    Initialization agent that:
    1. Checks for transaction deduplication
    2. Creates agent run record
    3. Loads user context data into session state
    4. Packages everything for downstream agents
    """

    def __init__(self):
        super().__init__(
            name="init_agent",
            description="Initializes transaction analysis by checking deduplication, creating run record, and loading user context"
        )

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """
        Min execution logic for initialization.

        Expected session state:
        - incoming_transaction: dict
        - user_id: str
        - session_id: str
        """
        try:
            # Extract required data from session state
            incoming_transaction = ctx.session.state.get("incoming_transaction")
            user_id = ctx.session.state.get("user_id")
            session_id = ctx.session.state.get("session_id")

            if not incoming_transaction or not user_id:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text=f"Missing required data: transaction={bool(incoming_transaction)}, user_id={bool(user_id)}")])
                )
                return
            
            # Step 1: Check for transaction deduplication
            plaid_transaction_id = incoming_transaction.get("plaid_transaction_id")
            is_test_transaction = incoming_transaction.get("is_test_transaction", False)
            
            # Parallel execution: Check deduplication and create run record simultaneously
            run_id = str(uuid.uuid4())
            run_data = {
                "user_id": user_id,
                "batch_id": plaid_transaction_id or f"manual_{session_id}",
                "mode": AGENT_MODES["PER_TX"],
                "status": AGENT_STATUS["RUNNING"]
            }
            
            if plaid_transaction_id and not is_test_transaction:
                # Run deduplication check and agent run creation in parallel
                import asyncio
                exists_result, create_result = await asyncio.gather(
                    check_transaction_exists_async(plaid_transaction_id),
                    create_agent_run_async(run_data),
                    return_exceptions=True
                )
                
                if isinstance(exists_result, dict) and exists_result.get("status") == "success" and exists_result.get("exists"):
                    yield Event(
                        author=self.name,
                        content=Content(parts=[Part(text=f"Transaction {plaid_transaction_id} already processed. Skipping analysis.")])
                    )
                    ctx.session.state["skip_analysis"] = True
                    return
            else:
                # No deduplication check needed
                create_result = await create_agent_run_async(run_data)
            
            # Extract run_id from create result
            if isinstance(create_result, dict) and create_result.get("status") == "success":
                run_id = create_result.get("run_id")
            else:
                # Continue with analysis but without run_id
                run_id = None
            
            # Step 2: Fetch all user context in parallel (3 queries at once)
            context_data = await fetch_user_context_parallel(user_id, days=30)
            
            user_rules = context_data["user_rules"]
            baseline_transactions = context_data["baseline_transactions"]
            user_accounts = context_data["user_accounts"]
            baseline_stats = context_data["baseline_stats"]
            
            # Yield event with state updates via EventActions
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Initialization complete. Run ID: {run_id}. Loaded {len(user_rules)} rules, {len(baseline_transactions)} baseline transactions, {len(user_accounts)} accounts.")]),
                actions=EventActions(state_delta={
                    "run_id": run_id,
                    "user_rules": user_rules,
                    "baseline_transactions": baseline_transactions,
                    "user_accounts": user_accounts,
                    "init_complete": True,
                    "skip_analysis": False,
                    "baseline_stats": baseline_stats
                })
            )
            
        except Exception as e:
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Initialization failed: {str(e)}")]),
                actions=EventActions(state_delta={
                    "init_error": str(e),
                    "skip_analysis": True
                })
            )

# Create the agent instance
init_agent = InitAgent()