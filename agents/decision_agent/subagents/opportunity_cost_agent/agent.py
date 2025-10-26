"""
Opportunity Cost Agent

Analyzes alternative uses of money (investing vs. spending).

Inputs:
- user_financial_profile
- tco_results
- decision_inputs

Outputs:
- opportunity_cost_analysis: Dict with opportunity cost for each option
"""

from typing import AsyncGenerator, Dict, Any
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part

from .tools import (
    calculate_investment_opportunity_cost,
    compare_invest_vs_prepay_debt,
    calculate_deferral_opportunity_cost
)


class OpportunityCostAgent(BaseAgent):
    """
    Opportunity Cost Agent - Analyzes alternative uses of money
    
    Calculates what the money could earn if invested instead of spent.
    Provides insights on:
    - Investment opportunity cost
    - Prepaying debt vs. investing
    - Deferral benefits (for timing decisions)
    """
    
    def __init__(self):
        super().__init__(
            name="opportunity_cost_agent",
            description="Analyzes opportunity costs including investment returns, debt prepayment, and deferral benefits"
        )
    
    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """
        Calculate opportunity cost for all options
        
        Expected session state:
        - user_financial_profile: Dict with financial metrics
        - tco_results: List[Dict] with TCO calculations
        - decision_inputs: Dict with user's decision parameters
        - decision_type: Type of decision
        """
        try:
            user_profile_data = ctx.session.state.get("user_financial_profile", {})
            tco_results = ctx.session.state.get("tco_results", [])
            decision_inputs = ctx.session.state.get("decision_inputs", {})
            decision_type = ctx.session.state.get("decision_type", "")
            
            if not user_profile_data or not tco_results:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Error: Missing user profile or TCO results")]),
                    actions=EventActions(state_delta={
                        "opportunity_cost_error": "Missing required inputs"
                    })
                )
                return
            
            user_profile = user_profile_data.get("user_profile", {})
            
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Analyzing opportunity costs for {len(tco_results)} options...")])
            )
            
            # Analyze each option
            opportunity_analyses = []
            
            for option in tco_results:
                option_name = option.get("name", "Unknown")
                down_payment = option.get("tco_breakdown", {}).get("down_payment", 0)
                monthly_payment = option.get("monthly_equivalent", 0)
                tenure_months = decision_inputs.get("tenure_months", 36)
                
                # Get APR if financing
                apr = option.get("apr", 0) or 0
                
                # Calculate investment opportunity cost
                investment_opp_cost = calculate_investment_opportunity_cost(
                    cash_outlay=down_payment,
                    monthly_payment=monthly_payment,
                    tenure_months=tenure_months,
                    expected_return_rate=0.07
                )
                
                # Compare investing vs. prepaying debt
                invest_vs_debt = compare_invest_vs_prepay_debt(
                    user_profile=user_profile,
                    available_cash=down_payment,
                    new_loan_apr=apr
                )
                
                opportunity_analyses.append({
                    "option_name": option_name,
                    "investment_opportunity_cost": investment_opp_cost,
                    "invest_vs_debt_comparison": invest_vs_debt,
                    "apr": apr
                })
            
            # For travel timing decisions, calculate deferral benefit
            deferral_analysis = None
            if decision_type == "travel_timing":
                monthly_surplus = user_profile.get("monthly_income", 0) - user_profile.get("average_monthly_expenses", 0)
                if monthly_surplus > 0:
                    deferral_analysis = calculate_deferral_opportunity_cost(
                        monthly_surplus=monthly_surplus,
                        deferral_months=3,  # Example: 3-month deferral
                        expected_return_rate=0.07
                    )
            
            # Generate summary
            summary_lines = ["Opportunity Cost Analysis Complete:"]
            for analysis in opportunity_analyses:
                total_opp_cost = analysis["investment_opportunity_cost"]["total_opportunity_cost"]
                summary_lines.append(
                    f"- {analysis['option_name']}: "
                    f"${total_opp_cost:,.0f} opportunity cost over tenure"
                )
            summary = "\n".join(summary_lines)
            
            # Write results to session state
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=summary)]),
                actions=EventActions(state_delta={
                    "opportunity_cost_analysis": opportunity_analyses,
                    "deferral_analysis": deferral_analysis,
                    "opportunity_cost_complete": True
                })
            )
            
        except Exception as e:
            error_msg = f"Opportunity Cost Agent failed: {str(e)}"
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=error_msg)]),
                actions=EventActions(state_delta={
                    "opportunity_cost_error": str(e),
                    "opportunity_cost_complete": False
                })
            )

