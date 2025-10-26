"""
Budget Coaching Agent

Provides personalized budget analysis and spending guidance for transactions.
Analyzes spending patterns against budget limits and historical trends:
- Compares current spending to budget caps by category
- Identifies over-budget situations and calculates percentage overage
- Tracks category spending trends (increasing/decreasing/stable)
- Provides actionable tips for better financial management
- Generates alerts for concerning spending patterns

Uses LLM to interpret spending context and provide human-readable insights.
"""

from typing import AsyncGenerator
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part

from .prompt import BUDGET_ANALYSIS_PROMPT
from ...utils.json_parser import parse_json_response
from ...a2a import a2a_client, BudgetAgentMessageHandler
from ...config import get_llm_client, LLM_MODEL


class BudgetAgent(BaseAgent):
    """
    Custom BaseAgent that:
    1. Reads transaction and spending history from session state
    2. Formats it for the LLM with budget coaching context
    3. Parses LLM JSON response
    4. Writes structured dict to session state
    """

    def __init__(self):
        super().__init__(
            name="budget_agent",
            description="Analyzes budget compliance and requests cashflow scenarios via A2A"
        )
        
        # Initialize A2A communication
        self._a2a_handler = BudgetAgentMessageHandler()
        a2a_client.register_message_handler("budget_agent", self._a2a_handler)

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """Execute budget coaching with proper state management."""
        
        try:
            # Use shared LLM client for efficiency
            client = get_llm_client()
            
            # Step 1: Read from session state
            transaction = ctx.session.state.get("incoming_transaction", {})
            baseline_transactions = ctx.session.state.get("baseline_transactions", [])
            categorization_result = ctx.session.state.get("categorization_result", {})
            
            if not transaction:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Error: No transaction data found in session state")]),
                    actions=EventActions(state_delta={
                        "budget_result": {"error": "No transaction data"}
                    })
                )
                return
            
            # Step 2: Extract transaction details
            amount = transaction.get("amount", 0)
            merchant_name = transaction.get("merchant_name", "Unknown")
            category = categorization_result.get("category", "unknown")
            subcategory = categorization_result.get("subcategory", "unknown")
            
            # Step 3: Calculate category spending
            category_transactions = [
                tx for tx in baseline_transactions 
                if tx.get("category", "").lower() == category.lower()
            ]
            category_total = sum(float(tx.get("amount", 0)) for tx in category_transactions)
            category_count = len(category_transactions)
            category_avg = category_total / max(category_count, 1)
            
            # Calculate overall spending
            total_spend_30d = sum(float(tx.get("amount", 0)) for tx in baseline_transactions)
            
            # Format prompt
            prompt = BUDGET_ANALYSIS_PROMPT.format(
                merchant_name=merchant_name,
                amount=amount,
                category=category,
                subcategory=subcategory,
                total_spend_30d=total_spend_30d,
                category_total=category_total,
                category_count=category_count,
                category_avg=category_avg
            )

            # Step 4: Call LLM directly with optimized model
            response = await client.aio.models.generate_content(
                model=LLM_MODEL,
                contents=prompt
            )
            
            # Extract text from response
            llm_response_text = response.text if hasattr(response, 'text') else str(response)
            
            # Step 5: Parse JSON response
            result_dict = parse_json_response(llm_response_text)
            
            if result_dict and isinstance(result_dict, dict):
                # Ensure required fields exist
                if "over_budget" not in result_dict:
                    result_dict["over_budget"] = False
                if "tips" not in result_dict:
                    result_dict["tips"] = []
                
                # Step 6: A2A Communication - Scenario Planning
                # Trigger on budget concerns, not just over budget
                budget_percentage = result_dict.get("budget_percentage", 0)
                if result_dict.get("over_budget") or (budget_percentage > 80):
                    budget_excess = max(budget_percentage - 100, budget_percentage - 80)
                    if budget_excess > 0:
                        scenario_request = {
                            "type": "spending_reduction_scenario",
                            "scenario_type": "spending_reduction_scenario",
                            "current_spending": amount,
                            "proposed_reduction": budget_excess,
                            "category": category,
                            "timeframe": "30_days"
                        }
                        
                        # Send A2A message to cashflow agent
                        scenario_result = await a2a_client.send_message(
                            from_agent="budget_agent",
                            to_agent="cashflow_agent",
                            message=scenario_request
                        )
                        
                        if scenario_result:
                            result_dict["a2a_scenarios"] = {
                                "cashflow_impact": scenario_result,
                                "scenario_requested": True
                            }
                            # Add scenario-based tip
                            if scenario_result.get("runway_extension", 0) > 0:
                                result_dict["tips"].append(
                                    f"Reducing {category} spending by ${budget_excess:.2f} could extend your runway by {scenario_result.get('runway_extension', 0)} days"
                                )
                
                # Step 7: Write structured output to state
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text=f"Budget analysis complete: {'Over budget' if result_dict.get('over_budget') else 'Within budget'}, {len(result_dict.get('tips', []))} tips provided")]),
                    actions=EventActions(state_delta={
                        "budget_result": result_dict
                    })
                )
            else:
                # Parsing failed, provide default response
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text=f"Budget analysis complete (text response): {llm_response_text[:200]}...")]),
                    actions=EventActions(state_delta={
                        "budget_result": {
                            "over_budget": False,
                            "tips": [],
                            "raw_response": llm_response_text,
                            "error": "Failed to parse JSON"
                        }
                    })
                )
                
        except Exception as e:
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Budget analysis error: {str(e)}")]),
                actions=EventActions(state_delta={
                    "budget_result": {"error": str(e), "over_budget": False}
                })
            )

# Create the agent instance
budget_agent = BudgetAgent()

