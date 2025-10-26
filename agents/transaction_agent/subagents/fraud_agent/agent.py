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

from .tools import calculate_z_score, check_geo_anomaly, check_velocity
from .prompt import FRAUD_ANALYSIS_PROMPT
from ...utils.json_parser import parse_json_response
from ...a2a import a2a_client, FraudAgentMessageHandler
from ...config import get_llm_client, LLM_MODEL


class FraudAgent(BaseAgent):
    """
    Custom BaseAgent that:
    1. Reads transaction and baseline data from session state
    2. Formats it for the LLM with fraud detection context
    3. Parses LLM JSON response
    4. Writes structured dict to session state
    """

    def __init__(self):
        super().__init__(
            name="fraud_agent",
            description="Detects fraudulent transactions using statistical analysis and A2A verification"
        )
        
        # Initialize A2A communication
        self._a2a_handler = FraudAgentMessageHandler()
        a2a_client.register_message_handler("fraud_agent", self._a2a_handler)

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """Execute fraud detection with proper state management."""
        
        try:
            # Use shared LLM client for efficiency
            client = get_llm_client()
            
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
                # Ensure fraud_score exists
                if "fraud_score" not in result_dict:
                    result_dict["fraud_score"] = 0.0
                
                # Step 6: A2A Communication - Merchant Verification
                fraud_score = result_dict.get("fraud_score", 0.0)
                # Lower threshold from 0.7 to 0.5 to increase A2A usage
                if fraud_score > 0.5 and merchant_name.lower() not in ["starbucks", "mcdonalds", "amazon", "shell"]:
                    # Moderate fraud score with unknown merchant - request verification
                    verification_request = {
                        "type": "merchant_verification",
                        "merchant": merchant_name,
                        "amount": amount,
                        "context": "fraud_suspicious",
                        "fraud_indicators": result_dict.get("alerts", []),
                        "fraud_score": fraud_score
                    }
                    
                    # Send A2A message to categorization agent
                    verification_result = await a2a_client.send_message(
                        from_agent="fraud_agent",
                        to_agent="categorization_agent", 
                        message=verification_request
                    )
                    
                    if verification_result and verification_result.get("merchant_verified"):
                        # Merchant verified - reduce fraud score
                        categorization_confidence = verification_result.get("confidence", 0.0)
                        if categorization_confidence > 0.8:
                            result_dict["fraud_score"] = max(0.0, fraud_score - 0.3)  # Reduce by 0.3
                            result_dict["alerts"].append("merchant_verified_by_categorization")
                            result_dict["a2a_verification"] = {
                                "verified": True,
                                "confidence": categorization_confidence,
                                "original_score": fraud_score,
                                "adjusted_score": result_dict["fraud_score"]
                            }
                    else:
                        # Merchant not verified - keep high fraud score
                        result_dict["a2a_verification"] = {
                            "verified": False,
                            "confidence": verification_result.get("confidence", 0.0) if verification_result else 0.0,
                            "reason": "merchant_not_verified"
                        }
                
                # Step 7: Write structured output to state
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

