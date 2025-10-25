"""
Database Persistence Agent

Final agent in the transaction analysis pipeline that persists all results to Supabase.
Handles database operations for:
- Updating transaction records with analysis results
- Creating insight records
- Generating alerts for fraud, budget, and cashflow issues
- Updating agent run completion status

This agent completes the pipeline by ensuring all analysis results are properly stored
in the database for dashboard consumption and historical tracking.
"""

from typing import AsyncGenerator, Dict, Any
from datetime import datetime
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part

from .tools import persist_analysis_results


class DatabaseAgent(BaseAgent):
    """
    Database persistence agent that:
    1. Reads all analysis results from session state
    2. Persists transaction updates, insights, and alerts to Supabase
    3. Updates agent run completion status
    4. Provides comprehensive persistence results
    """

    def __init__(self):
        super().__init__(
            name="database_agent",
            description="Persists transaction analysis results to Supabase database"
        )

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """Execute database persistence with proper state management."""
        
        try:
            # Step 1: Read required data from session state
            user_id = ctx.session.state.get("user_id")
            run_id = ctx.session.state.get("run_id")
            incoming_transaction = ctx.session.state.get("incoming_transaction", {})
            final_insight = ctx.session.state.get("final_insight", {})
            
            # Check if we should skip (from init agent deduplication)
            skip_analysis = ctx.session.state.get("skip_analysis", False)
            if skip_analysis:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Skipping database persistence due to duplicate transaction")]),
                    actions=EventActions(state_delta={
                        "database_result": {
                            "status": "skipped",
                            "message": "Transaction already processed"
                        }
                    })
                )
                return
            
            # Validate required data
            if not user_id:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text=f"Missing required data: user_id={bool(user_id)}")]),
                    actions=EventActions(state_delta={
                        "database_result": {
                            "status": "error",
                            "error": "Missing user_id"
                        }
                    })
                )
                return
            
            # Handle missing run_id (when init agent fails)
            if not run_id:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="No run_id available (init agent failed), skipping database persistence")]),
                    actions=EventActions(state_delta={
                        "database_result": {
                            "status": "skipped",
                            "message": "No run_id available - init agent failed",
                            "transaction_updated": False,
                            "insight_created": False,
                            "alerts_created": [],
                            "run_updated": False
                        },
                        "database_complete": True,
                        "pipeline_complete": True
                    })
                )
                return
            
            plaid_transaction_id = incoming_transaction.get("plaid_transaction_id")
            if not plaid_transaction_id:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Missing plaid_transaction_id in incoming transaction")]),
                    actions=EventActions(state_delta={
                        "database_result": {
                            "status": "error",
                            "error": "Missing plaid_transaction_id"
                        }
                    })
                )
                return
            
            # Step 2: Collect analysis results from session state
            analysis_results = {
                "categorization_result": ctx.session.state.get("categorization_result", {}),
                "fraud_result": ctx.session.state.get("fraud_result", {}),
                "budget_result": ctx.session.state.get("budget_result", {}),
                "cashflow_result": ctx.session.state.get("cashflow_result", {}),
                "consensus_result": ctx.session.state.get("consensus_result", {}),
                "merged_results": ctx.session.state.get("merged_results", {})
            }
            
            # Step 3: Create timing data
            timings = {
                "database_persistence_start": datetime.now().isoformat(),
                "pipeline_completion": datetime.now().isoformat()
            }
            
            # Step 4: Persist all results to database
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text="Starting database persistence...")])
            )
            
            persistence_result = persist_analysis_results(
                user_id=user_id,
                run_id=run_id,
                plaid_transaction_id=plaid_transaction_id,
                analysis_results=analysis_results,
                final_insight=final_insight,
                timings=timings
            )
            
            # Step 5: Process results and create response
            if persistence_result["status"] == "success":
                message = f"Database persistence completed successfully. " \
                         f"Transaction updated: {persistence_result['transaction_updated']}, " \
                         f"Insight created: {persistence_result['insight_created']}, " \
                         f"Alerts created: {len(persistence_result['alerts_created'])}"
                
                if persistence_result.get("insight_id"):
                    message += f", Insight ID: {persistence_result['insight_id']}"
                
            elif persistence_result["status"] == "partial_success":
                message = f"Database persistence partially completed. " \
                         f"Errors: {len(persistence_result['errors'])}. " \
                         f"Transaction updated: {persistence_result['transaction_updated']}, " \
                         f"Insight created: {persistence_result['insight_created']}"
                
            else:  # failed
                message = f"Database persistence failed. Errors: {persistence_result['errors']}"
            
            # Step 6: Write results to session state
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=message)]),
                actions=EventActions(state_delta={
                    "database_result": persistence_result,
                    "database_complete": True,
                    "pipeline_complete": True
                })
            )
            
        except Exception as e:
            error_message = f"Database agent error: {str(e)}"
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=error_message)]),
                actions=EventActions(state_delta={
                    "database_result": {
                        "status": "error",
                        "error": str(e),
                        "transaction_updated": False,
                        "insight_created": False,
                        "alerts_created": [],
                        "run_updated": False
                    },
                    "database_complete": False,
                    "pipeline_complete": False
                })
            )


# Create agent instance
database_agent = DatabaseAgent()
