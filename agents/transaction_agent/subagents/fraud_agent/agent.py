"""
Fraud Detection Agent

Identifies potentially fraudulent transactions using statistical analysis and behavioral patterns.
Performs multiple fraud checks:
- Statistical outlier detection (Z-score analysis on transaction amounts)
- Geographic anomaly detection (unusual location patterns)
- Velocity checks (multiple transactions in short time periods)
- Merchant pattern analysis (unusual merchant combinations)

Combines Python tools for fast mathematical calculations with LLM interpretation
to generate a composite fraud score (0.0-1.0) and detailed reasoning.
"""

from typing import AsyncGenerator
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part
from google.genai import Client

from .tools import calculate_z_score, check_geo_anomaly, check_velocity
from .prompt import FRAUD_ANALYSIS_PROMPT
from ...utils.json_parser import parse_json_response


class FraudAgent(BaseAgent):
    """
    Custom BaseAgent that:
    1. Reads transaction and baseline data from session state
    2. Formats it for the LLM with fraud detection context
    3. Parses LLM JSON response
    4. Writes structured dict to session state
    """

    def __init__(self):
        super().__init__(name="fraud_agent")

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """Execute fraud detection with proper state management."""
        
        try:
            # Initialize LLM client
            client = Client()
            model = "gemini-2.5-flash"
            
            # Step 1: Read from session state
            transaction = ctx.session.state.get("incoming_transaction", {})
            baseline_transactions = ctx.session.state.get("baseline_transactions", [])
            baseline_stats = ctx.session.state.get("baseline_stats", {})
            
            if not transaction:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Error: No transaction data found in session state")]),
                    actions=EventActions(state_delta={
                        "fraud_result": {"error": "No transaction data"}
                    })
                )
                return
            
            # Step 2: Extract transaction details
            amount = transaction.get("amount", 0)
            merchant_name = transaction.get("merchant_name", "Unknown")
            posted_at = transaction.get("posted_at", "")
            location_city = transaction.get("location_city", "")
            location_state = transaction.get("location_state", "")
            payment_channel = transaction.get("payment_channel", "")
            
            # Step 3: Run fraud detection calculations using tools
            baseline_amounts = [float(tx.get("amount", 0)) for tx in baseline_transactions]
            avg_daily_spend = baseline_stats.get("avg_daily_spend", 0)
            total_amount_30d = baseline_stats.get("total_amount_30d", 0)
            
            # Calculate Z-score
            z_result = calculate_z_score(amount, baseline_amounts)
            z_score = z_result.get("z_score", 0)
            z_interpretation = z_result.get("interpretation", "normal")
            z_details = f"Mean: ${z_result.get('mean', 0):.2f}, StDev: ${z_result.get('stdev', 0):.2f}, Status: {z_result.get('status', 'unknown')}"
            
            # Check geographic anomaly
            current_location = {
                "location_city": location_city,
                "location_state": location_state
            }
            user_locations = [
                {"location_city": tx.get("location_city", ""), "location_state": tx.get("location_state", "")}
                for tx in baseline_transactions
            ]
            geo_result = check_geo_anomaly(current_location, user_locations)
            geo_anomaly = geo_result.get("anomaly", False)
            geo_details = f"Status: {geo_result.get('status', 'unknown')}, Distance: {geo_result.get('distance_miles', 'N/A')} miles"
            
            # Check velocity
            velocity_result = check_velocity(posted_at, baseline_transactions)
            velocity_suspicious = velocity_result.get("velocity_issue", False)
            velocity_details = f"Recent transactions: {velocity_result.get('transactions_last_hour', 0)}, Severity: {velocity_result.get('severity', 'low')}"
            
            # Prepare baseline summary
            baseline_summary = f"{len(baseline_transactions)} transactions in last 30 days"
            if baseline_amounts:
                import statistics
                mean_amount = statistics.mean(baseline_amounts)
                baseline_summary += f", avg amount: ${mean_amount:.2f}"
            
            # Step 4: Format prompt with calculated results
            prompt = FRAUD_ANALYSIS_PROMPT.format(
                merchant_name=merchant_name,
                amount=amount,
                posted_at=posted_at,
                location_city=location_city,
                location_state=location_state,
                payment_channel=payment_channel,
                z_score=z_score,
                z_interpretation=z_interpretation,
                z_details=z_details,
                geo_anomaly=geo_anomaly,
                geo_details=geo_details,
                velocity_suspicious=velocity_suspicious,
                velocity_details=velocity_details,
                baseline_summary=baseline_summary,
                avg_daily_spend=avg_daily_spend,
                total_amount_30d=total_amount_30d
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
                # Ensure fraud_score exists
                if "fraud_score" not in result_dict:
                    result_dict["fraud_score"] = 0.0
                
                # Step 6: Write structured output to state
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text=f"Fraud analysis complete: score {result_dict.get('fraud_score', 0):.2f}, {len(result_dict.get('alerts', []))} alerts")]),
                    actions=EventActions(state_delta={
                        "fraud_result": result_dict
                    })
                )
            else:
                # Parsing failed, provide default safe response
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text=f"Fraud analysis complete (text response): {llm_response_text[:200]}...")]),
                    actions=EventActions(state_delta={
                        "fraud_result": {
                            "fraud_score": 0.0,
                            "alerts": [],
                            "raw_response": llm_response_text,
                            "error": "Failed to parse JSON"
                        }
                    })
                )
                
        except Exception as e:
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Fraud detection error: {str(e)}")]),
                actions=EventActions(state_delta={
                    "fraud_result": {"error": str(e), "fraud_score": 0.0}
                })
            )

# Create the agent instance
fraud_agent = FraudAgent()

