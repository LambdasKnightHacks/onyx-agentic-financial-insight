"""
Cashflow Forecasting Agent

Analyzes account balances and transaction patterns to predict future cashflow.
Performs financial health assessments:
- Calculates runway days (days until balance reaches zero)
- Forecasts account balance for 7, 14, and 30-day periods
- Identifies low balance situations requiring attention
- Provides severity assessment (info/warning/critical)
- Generates recommendations for improving cashflow management

Uses Python tools for precise financial calculations combined with LLM
for contextual recommendations and risk assessment.
"""

from typing import AsyncGenerator
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part
from google.genai import Client

from .tools import calculate_runway_days, forecast_balance
from .prompt import CASHFLOW_ANALYSIS_PROMPT
from ...utils.json_parser import parse_json_response


class CashflowAgent(BaseAgent):
    """
    Custom BaseAgent that:
    1. Reads transaction, accounts, and spending data from session state
    2. Formats it for the LLM with cashflow forecasting context
    3. Parses LLM JSON response
    4. Writes structured dict to session state
    """

    def __init__(self):
        super().__init__(name="cashflow_agent")

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """Execute cashflow forecasting with proper state management."""
        
        try:
            # Initialize LLM client
            client = Client()
            model = "gemini-2.5-flash"
            
            # Step 1: Read from session state
            transaction = ctx.session.state.get("incoming_transaction", {})
            baseline_stats = ctx.session.state.get("baseline_stats", {})
            user_accounts = ctx.session.state.get("user_accounts", [])
            
            if not transaction:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Error: No transaction data found in session state")]),
                    actions=EventActions(state_delta={
                        "cashflow_result": {"error": "No transaction data"}
                    })
                )
                return
            
            # Step 2: Extract transaction and account details
            amount = transaction.get("amount", 0)
            merchant_name = transaction.get("merchant_name", "Unknown")
            
            # Get account balance
            current_balance = 0.0
            if user_accounts:
                # Sum all account balances
                current_balance = sum(float(acc.get("balance", 0)) for acc in user_accounts)
            
            # Get spending stats
            avg_daily_spend = baseline_stats.get("avg_daily_spend", 0)
            total_amount_30d = baseline_stats.get("total_amount_30d", 0)
            transaction_count = baseline_stats.get("transaction_count", 0)
            
            # Step 3: Calculate runway using tools
            runway_result = calculate_runway_days(current_balance, avg_daily_spend)
            runway_days = runway_result.get("runway_days", 0)
            severity = runway_result.get("severity", "info")
            low_balance_alert = runway_days < 30
            
            # Step 4: Forecast balance using tools
            forecast_7d = forecast_balance(current_balance, avg_daily_spend, 7)
            forecast_14d = forecast_balance(current_balance, avg_daily_spend, 14)
            forecast_30d = forecast_balance(current_balance, avg_daily_spend, 30)
            
            # Step 5: Format prompt with calculated results
            prompt = CASHFLOW_ANALYSIS_PROMPT.format(
                merchant_name=merchant_name,
                amount=amount,
                current_balance=current_balance,
                num_accounts=len(user_accounts),
                avg_daily_spend=avg_daily_spend,
                total_amount_30d=total_amount_30d,
                transaction_count=transaction_count,
                runway_days=runway_days,
                low_balance_alert="Yes" if low_balance_alert else "No",
                low_balance_alert_bool="true" if low_balance_alert else "false",
                severity=severity,
                forecast_7d=forecast_7d.get("forecasted_balance", 0),
                forecast_14d=forecast_14d.get("forecasted_balance", 0),
                forecast_30d=forecast_30d.get("forecasted_balance", 0)
            )

            # Step 4: Call LLM directly
            response = await client.aio.models.generate_content(
                model=model,
                contents=prompt
            )
            
            # Extract text from response
            llm_response_text = response.text if hasattr(response, 'text') else str(response)
            
            # Step 5: Parse JSON response
            result_dict = parse_json_response(llm_response_text)
            
            if result_dict and isinstance(result_dict, dict):
                # Ensure required fields exist
                if "runway_days" not in result_dict:
                    result_dict["runway_days"] = runway_days
                if "low_balance_alert" not in result_dict:
                    result_dict["low_balance_alert"] = runway_days < 30
                
                # Step 6: Write structured output to state
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text=f"Cashflow analysis complete: {result_dict.get('runway_days', 0)} day runway, {'Low balance alert' if result_dict.get('low_balance_alert') else 'Healthy'}")]),
                    actions=EventActions(state_delta={
                        "cashflow_result": result_dict
                    })
                )
            else:
                # Parsing failed, provide default response
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text=f"Cashflow analysis complete (text response): {llm_response_text[:200]}...")]),
                    actions=EventActions(state_delta={
                        "cashflow_result": {
                            "runway_days": runway_days,
                            "low_balance_alert": runway_days < 30,
                            "raw_response": llm_response_text,
                            "error": "Failed to parse JSON"
                        }
                    })
                )
                
        except Exception as e:
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Cashflow analysis error: {str(e)}")]),
                actions=EventActions(state_delta={
                    "cashflow_result": {"error": str(e), "runway_days": 0}
                })
            )

# Create the agent instance
cashflow_agent = CashflowAgent()

