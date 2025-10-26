"""
Credit Impact Agent

Simulates credit score impact of decision options.

Inputs:
- user_financial_profile
- tco_results
- decision_type

Outputs:
- credit_impact_analysis: Dict with credit impact for each option
"""

from typing import AsyncGenerator, Dict, Any
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part

from .tools import estimate_credit_impact, simulate_credit_scenarios


class CreditImpactAgent(BaseAgent):
    """
    Credit Impact Agent - Simulates credit score impact
    
    Analyzes how each decision option affects credit score through:
    - Hard inquiries
    - New account impacts
    - Utilization changes
    - Credit mix improvements
    - Payment history benefits
    """
    
    def __init__(self):
        super().__init__(
            name="credit_impact_agent",
            description="Simulates credit score impact including inquiries, utilization, and long-term benefits"
        )
    
    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """
        Estimate credit impact for all options
        
        Expected session state:
        - decision_type: Type of decision
        - user_financial_profile: Dict with financial metrics
        - tco_results: List[Dict] with TCO calculations
        """
        try:
            decision_type = ctx.session.state.get("decision_type", "")
            user_profile_data = ctx.session.state.get("user_financial_profile", {})
            tco_results = ctx.session.state.get("tco_results", [])
            
            if not decision_type or not user_profile_data or not tco_results:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Error: Missing decision type, user profile, or TCO results")]),
                    actions=EventActions(state_delta={
                        "credit_impact_error": "Missing required inputs"
                    })
                )
                return
            
            user_profile = user_profile_data.get("user_profile", {})
            
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Simulating credit score impact for {len(tco_results)} options...")])
            )
            
            # Analyze each option
            credit_analyses = []
            
            # Assume base credit score (could be fetched from user profile if available)
            base_credit_score = user_profile.get("credit_score", 720)
            
            for option in tco_results:
                option_name = option.get("name", "Unknown")
                
                # Estimate credit impact
                impact_analysis = estimate_credit_impact(
                    decision_type=decision_type,
                    option_details=option,
                    user_profile=user_profile
                )
                
                # Simulate credit score trajectory
                credit_scenarios = simulate_credit_scenarios(
                    base_score=base_credit_score,
                    impact_analysis=impact_analysis
                )
                
                credit_analyses.append({
                    "option_name": option_name,
                    "impact_range": impact_analysis["estimated_impact_range"],
                    "score_delta_min": impact_analysis["score_delta_min"],
                    "score_delta_max": impact_analysis["score_delta_max"],
                    "impact_factors": impact_analysis["impact_factors"],
                    "recovery_timeline_months": impact_analysis["recovery_timeline_months"],
                    "severity": impact_analysis["severity"],
                    "notes": impact_analysis["notes"],
                    "credit_scenarios": credit_scenarios
                })
            
            # Generate summary
            summary_lines = ["Credit Impact Analysis Complete:"]
            for analysis in credit_analyses:
                summary_lines.append(
                    f"- {analysis['option_name']}: "
                    f"{analysis['impact_range']}, "
                    f"Severity: {analysis['severity']}, "
                    f"Recovery: ~{analysis['recovery_timeline_months']} months"
                )
            summary = "\n".join(summary_lines)
            
            # Write results to session state
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=summary)]),
                actions=EventActions(state_delta={
                    "credit_impact_analysis": credit_analyses,
                    "credit_impact_complete": True
                })
            )
            
        except Exception as e:
            error_msg = f"Credit Impact Agent failed: {str(e)}"
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=error_msg)]),
                actions=EventActions(state_delta={
                    "credit_impact_error": str(e),
                    "credit_impact_complete": False
                })
            )

