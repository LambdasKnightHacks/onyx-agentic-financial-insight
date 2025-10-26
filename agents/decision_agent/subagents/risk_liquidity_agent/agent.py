"""
Risk & Liquidity Agent

Assesses financial risk and liquidity impact of decision options.
Runs comprehensive stress tests and calculates liquidity scores.

Inputs:
- user_financial_profile
- tco_results (list of options with costs)

Outputs:
- risk_liquidity_analysis: Dict with runway, stress scenarios, liquidity scores
"""

from typing import AsyncGenerator, List, Dict, Any
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part

from .tools import (
    calculate_runway_impact,
    run_stress_scenarios,
    calculate_liquidity_score,
    assess_overall_risk
)


class RiskLiquidityAgent(BaseAgent):
    """
    Risk & Liquidity Agent - Assesses financial risk and liquidity impact
    
    Performs comprehensive risk analysis including:
    - Financial runway calculations
    - Stress test scenarios
    - Liquidity scoring
    - DTI ratio analysis
    """
    
    def __init__(self):
        super().__init__(
            name="risk_liquidity_agent",
            description="Assesses financial risk and liquidity impact through runway analysis, stress tests, and liquidity scoring"
        )
    
    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """
        Analyze risk and liquidity for all options
        
        Expected session state:
        - user_financial_profile: Dict with financial metrics
        - tco_results: List[Dict] with TCO calculations for each option
        """
        try:
            # Extract from session state
            user_profile_data = ctx.session.state.get("user_financial_profile", {})
            tco_results = ctx.session.state.get("tco_results", [])
            
            if not user_profile_data or not tco_results:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Error: Missing user profile or TCO results")]),
                    actions=EventActions(state_delta={
                        "risk_liquidity_error": "Missing required inputs"
                    })
                )
                return
            
            user_profile = user_profile_data.get("user_profile", {})
            
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Analyzing risk and liquidity for {len(tco_results)} options...")])
            )
            
            # Analyze each option
            risk_analyses = []
            
            for option in tco_results:
                option_name = option.get("name", "Unknown")
                monthly_payment = option.get("monthly_equivalent", 0)
                down_payment = option.get("tco_breakdown", {}).get("down_payment", 0)
                
                # Calculate current daily spending
                avg_monthly_expenses = user_profile.get("average_monthly_expenses", 0)
                avg_daily_spend = avg_monthly_expenses / 30
                
                # Calculate runway impact
                runway_impact = calculate_runway_impact(
                    current_balance=user_profile.get("total_balance", 0),
                    monthly_payment=monthly_payment,
                    avg_daily_spend=avg_daily_spend,
                    down_payment=down_payment
                )
                
                # Run stress scenarios
                stress_scenarios = run_stress_scenarios(
                    user_profile=user_profile,
                    new_payment=monthly_payment,
                    down_payment=down_payment
                )
                
                # Calculate liquidity score
                liquidity_score = calculate_liquidity_score(
                    user_profile=user_profile,
                    down_payment=down_payment,
                    monthly_payment=monthly_payment
                )
                
                # Calculate new DTI ratio
                monthly_income = user_profile.get("monthly_income", 1)
                current_dti = user_profile.get("current_dti_ratio", 0)
                new_monthly_expenses = avg_monthly_expenses + monthly_payment
                
                # Approximate new DTI (assuming payment adds to debt obligations)
                new_dti_ratio = current_dti + (monthly_payment / monthly_income)
                
                # Assess overall risk
                overall_risk = assess_overall_risk(
                    liquidity_score=liquidity_score,
                    runway_impact=runway_impact,
                    stress_scenarios=stress_scenarios,
                    dti_ratio_new=new_dti_ratio
                )
                
                risk_analyses.append({
                    "option_name": option_name,
                    "runway_impact": runway_impact,
                    "stress_scenarios": stress_scenarios,
                    "liquidity_score": liquidity_score,
                    "dti_ratio_new": round(new_dti_ratio, 3),
                    "overall_risk": overall_risk
                })
            
            # Generate summary
            summary_lines = ["Risk & Liquidity Analysis Complete:"]
            for analysis in risk_analyses:
                summary_lines.append(
                    f"- {analysis['option_name']}: "
                    f"Liquidity {analysis['liquidity_score']:.2f}, "
                    f"Runway {analysis['runway_impact']['new_runway_days']} days, "
                    f"Risk: {analysis['overall_risk']['overall_risk']}"
                )
            summary = "\n".join(summary_lines)
            
            # Write results to session state
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=summary)]),
                actions=EventActions(state_delta={
                    "risk_liquidity_analysis": risk_analyses,
                    "risk_liquidity_complete": True
                })
            )
            
        except Exception as e:
            error_msg = f"Risk & Liquidity Agent failed: {str(e)}"
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=error_msg)]),
                actions=EventActions(state_delta={
                    "risk_liquidity_error": str(e),
                    "risk_liquidity_complete": False
                })
            )

