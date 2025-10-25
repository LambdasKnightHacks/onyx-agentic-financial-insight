"""
Results Reducer Agent

Collects and merges outputs from all parallel analysis agents into a unified structure.
Handles partial results gracefully and ensures data consistency across the pipeline.
Performs data validation and normalization before passing results to downstream agents.

Key functions:
- Merges categorization, fraud, budget, and cashflow results
- Handles missing or failed agent outputs
- Normalizes data formats and ensures required fields exist
- Provides unified data structure for synthesizer agent
"""

from typing import AsyncGenerator, Dict, Any, Optional
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part

from .tools import (
    merge_results,
    get_timestamp
)


class ReducerAgent(BaseAgent):
    """
    Reducer agent that:
    1. Reads results from all parallel analysis agents
    2. Merges them into a unified structure
    3. Handles partial results gracefully
    4. Validates and normalizes data
    5. Writes merged results to session state
    """

    def __init__(self):
        super().__init__(
            name="reducer_agent",
            description="Merges parallel analysis results into unified structure"
        )

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """Execute result reduction with proper state management."""
        
        try:
            # Step 1: Read all agent results from session state
            categorization_result = ctx.session.state.get("categorization_result", {})
            fraud_result = ctx.session.state.get("fraud_result", {})
            budget_result = ctx.session.state.get("budget_result", {})
            cashflow_result = ctx.session.state.get("cashflow_result", {})
            
            # Step 2: Validate that we have at least some results
            results_count = sum(1 for result in [categorization_result, fraud_result, budget_result, cashflow_result] 
                              if result and not result.get("error"))
            
            if results_count == 0:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Error: No analysis results found in session state")]),
                    actions=EventActions(state_delta={
                        "merged_results": {"error": "No analysis results available"}
                    })
                )
                return
            
            # Step 3: Merge results into unified structure
            merged_results = merge_results(
                categorization_result,
                fraud_result, 
                budget_result,
                cashflow_result
            )
            
            # Step 4: Add metadata
            merged_results["metadata"] = {
                "total_agents": 4,
                "successful_agents": results_count,
                "failed_agents": 4 - results_count,
                "reducer_timestamp": get_timestamp()
            }
            
            # Step 5: Write merged results to state
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Successfully merged {results_count}/4 agent results")]),
                actions=EventActions(state_delta={
                    "merged_results": merged_results
                })
            )
            
        except Exception as e:
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Reducer error: {str(e)}")]),
                actions=EventActions(state_delta={
                    "merged_results": {"error": str(e)}
                })
            )



# Create the agent instance
reducer_agent = ReducerAgent()
