"""
TCO Calculator Agent

Calculates Total Cost of Ownership for all options in the decision.
Routes to appropriate calculator based on decision type.

Inputs:
- decision_type
- options (list of dicts with option parameters)
- preferences (tenure_months, etc.)

Outputs:
- tco_results: List of TCO calculations for each option
"""

from typing import AsyncGenerator, List, Dict, Any
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part

from .calculators import calculate_car_tco, calculate_home_tco, calculate_travel_tco
from ...tools.validators import validate_tco_calculation


class TCOCalculatorAgent(BaseAgent):
    """
    TCO Calculator Agent - Calculates Total Cost of Ownership for all options
    
    Handles multiple decision types:
    - car_lease_vs_finance / car_lease_vs_buy
    - mortgage_vs_rent
    - travel_timing
    - generic_purchase
    """
    
    def __init__(self):
        super().__init__(
            name="tco_calculator_agent",
            description="Calculates Total Cost of Ownership for all decision options including payments, fees, and long-term costs"
        )
    
    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """
        Calculate TCO for all options in the decision
        
        Expected session state:
        - decision_type: str
        - options: List[Dict] - list of option parameters
        - preferences: Dict - includes tenure_months, etc.
        """
        try:
            # Extract from session state
            decision_type = ctx.session.state.get("decision_type")
            options = ctx.session.state.get("options", [])
            preferences = ctx.session.state.get("preferences", {})
            
            if not decision_type or not options:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Error: Missing decision_type or options")]),
                    actions=EventActions(state_delta={
                        "tco_calculator_error": "Missing required inputs"
                    })
                )
                return
            
            # Get tenure from preferences or use defaults
            tenure_months = preferences.get("tenure_months", self._get_default_tenure(decision_type))
            
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Calculating TCO for {len(options)} options over {tenure_months} months...")])
            )
            
            # Calculate TCO for each option
            tco_results = []
            
            for idx, option in enumerate(options):
                option_type = option.get("type")
                option_name = option.get("name", f"Option {idx + 1}")
                
                try:
                    # Route to appropriate calculator
                    tco_result = await self._calculate_option_tco(
                        decision_type=decision_type,
                        option_type=option_type,
                        params=option,
                        tenure_months=tenure_months
                    )
                    
                    # Validate TCO calculation
                    is_valid, errors = validate_tco_calculation(tco_result)
                    
                    if not is_valid:
                        yield Event(
                            author=self.name,
                            content=Content(parts=[Part(text=f"Warning: TCO validation failed for {option_name}: {', '.join(errors)}")])
                        )
                    
                    # Add option name to result
                    tco_result["name"] = option_name
                    tco_results.append(tco_result)
                    
                except Exception as e:
                    error_msg = f"Failed to calculate TCO for {option_name}: {str(e)}"
                    yield Event(
                        author=self.name,
                        content=Content(parts=[Part(text=error_msg)])
                    )
                    # Add placeholder result to continue processing
                    tco_results.append({
                        "name": option_name,
                        "option_type": option_type,
                        "tco_expected": 0,
                        "error": str(e)
                    })
            
            # Generate summary
            if tco_results:
                summary_lines = ["TCO Calculation Complete:"]
                for result in tco_results:
                    if "error" not in result:
                        summary_lines.append(
                            f"- {result['name']}: ${result['tco_expected']:,.2f} "
                            f"(${result['monthly_equivalent']:,.2f}/mo)"
                        )
                summary = "\n".join(summary_lines)
            else:
                summary = "No TCO results generated"
            
            # Write results to session state
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=summary)]),
                actions=EventActions(state_delta={
                    "tco_results": tco_results,
                    "tco_calculator_complete": True
                })
            )
            
        except Exception as e:
            error_msg = f"TCO Calculator Agent failed: {str(e)}"
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=error_msg)]),
                actions=EventActions(state_delta={
                    "tco_calculator_error": str(e),
                    "tco_calculator_complete": False
                })
            )
    
    async def _calculate_option_tco(
        self,
        decision_type: str,
        option_type: str,
        params: Dict[str, Any],
        tenure_months: int
    ) -> Dict[str, Any]:
        """Route to appropriate TCO calculator based on decision type"""
        
        if decision_type in ["car_lease_vs_finance", "car_lease_vs_buy"]:
            return calculate_car_tco(option_type, params, tenure_months)
        
        elif decision_type == "mortgage_vs_rent":
            return calculate_home_tco(option_type, params, tenure_months)
        
        elif decision_type == "travel_timing":
            return calculate_travel_tco(option_type, params, tenure_months)
        
        elif decision_type == "generic_purchase":
            # Simple generic TCO calculation
            return self._calculate_generic_tco(params, tenure_months)
        
        else:
            raise ValueError(f"Unsupported decision type: {decision_type}")
    
    def _calculate_generic_tco(self, params: Dict[str, Any], tenure_months: int) -> Dict[str, Any]:
        """Simple TCO for generic purchases"""
        purchase_price = params.get("purchase_price", 0)
        monthly_cost = params.get("monthly_cost", 0)
        upfront_cost = params.get("upfront_cost", purchase_price)
        
        total_monthly_costs = monthly_cost * tenure_months
        tco = upfront_cost + total_monthly_costs
        
        return {
            "option_type": "generic",
            "tco_expected": round(tco, 2),
            "tco_range": [round(tco * 0.90, 2), round(tco * 1.10, 2)],
            "tco_breakdown": {
                "upfront": round(upfront_cost, 2),
                "ongoing_costs": round(total_monthly_costs, 2)
            },
            "monthly_equivalent": round(monthly_cost, 2),
            "residual_value": 0
        }
    
    def _get_default_tenure(self, decision_type: str) -> int:
        """Get default analysis tenure based on decision type"""
        defaults = {
            "car_lease_vs_finance": 36,  # 3 years
            "car_lease_vs_buy": 60,  # 5 years
            "mortgage_vs_rent": 60,  # 5 years
            "travel_timing": 1,  # 1 month
            "generic_purchase": 12  # 1 year
        }
        return defaults.get(decision_type, 36)

