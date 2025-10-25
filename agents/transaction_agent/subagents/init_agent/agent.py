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
    check_transaction_exists,
    create_agent_run,
    fetch_user_category_rules,
    fetch_user_recent_transactions,
    fetch_user_accounts
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
            
            if plaid_transaction_id and not is_test_transaction:
                exists_result = check_transaction_exists(plaid_transaction_id)
                if exists_result.get("status") == "success" and exists_result.get("exists"):
                    yield Event(
                        author=self.name,
                        content=Content(parts=[Part(text=f"Transaction {plaid_transaction_id} already processed. Skipping analysis.")])
                    )
                    # Set flag to skip further processing
                    ctx.session.state["skip_analysis"] = True
                    return

            # Step 2: Create agent run record
            run_id = str(uuid.uuid4())
            run_data = {
                "user_id": user_id,
                "batch_id": plaid_transaction_id or f"manual_{session_id}",
                "mode": AGENT_MODES["PER_TX"],
                "status": AGENT_STATUS["RUNNING"]
            }
            
            create_result = create_agent_run(run_data)
            if create_result.get("status") != "success":
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text=f"Failed to create agent run: {create_result.get('error')}")])
                )
                # Continue with analysis but without run_id for database persistence
                run_id = None
            else:
                run_id = create_result.get("run_id")
            # Load user's custom category rules
            rules_result = fetch_user_category_rules(user_id)
            user_rules = rules_result.get("data", []) if rules_result.get("status") == "success" else []
            
            # Load recent transactions for fraud baseline
            recent_result = fetch_user_recent_transactions(user_id, days=30)
            baseline_transactions = recent_result.get("data", []) if recent_result.get("status") == "success" else []
            
            # Load user's accounts for cashflow analysis
            accounts_result = fetch_user_accounts(user_id)
            user_accounts = accounts_result.get("data", []) if accounts_result.get("status") == "success" else []
            
            # Step 4: Package context for downstream agents
            # Calculate some quick stats for context
            total_baseline_amount = sum(float(tx.get("amount", 0)) for tx in baseline_transactions)
            avg_daily_spend = total_baseline_amount / 30 if baseline_transactions else 0
            
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
                    "baseline_stats": {
                        "total_amount_30d": total_baseline_amount,
                        "avg_daily_spend": avg_daily_spend,
                        "transaction_count": len(baseline_transactions)
                    }
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