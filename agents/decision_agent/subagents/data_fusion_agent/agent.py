"""
Data Fusion Agent

Enriches decision analysis with comprehensive user financial profile.
First agent in the decision pipeline - provides foundational data for all other agents.

Responsibilities:
- Fetch transaction history (90 days)
- Calculate income/expense patterns
- Load active budgets
- Get account balances
- Compute behavioral metrics (elasticity, payment patterns)
- Package everything into session state
"""

from typing import AsyncGenerator
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part

from .tools import fetch_user_financial_profile
from ...tools.validators import validate_user_profile


class DataFusionAgent(BaseAgent):
    """
    Data Fusion Agent - Enriches decision context with complete financial profile
    
    Inputs (from session state):
    - user_id: str
    - analysis_id: str
    
    Outputs (to session state):
    - user_financial_profile: Dict containing:
      - user_profile: balance, income, expenses, DTI, etc.
      - spending_by_category: monthly averages and trends
      - active_budgets: current budget limits
      - obligations: recurring payments
      - behavioral_profile: elasticity scores, spending patterns
    """
    
    def __init__(self):
        super().__init__(
            name="data_fusion_agent",
            description="Enriches decision analysis with comprehensive user financial profile including transactions, budgets, and behavioral patterns"
        )
    
    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """
        Execute data fusion - fetch and compute complete financial profile
        
        Expected session state:
        - user_id: str
        - analysis_id: str (optional, for tracking)
        """
        try:
            # Extract required data from session state
            user_id = ctx.session.state.get("user_id")
            analysis_id = ctx.session.state.get("analysis_id")
            
            if not user_id:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Error: Missing user_id in session state")]),
                    actions=EventActions(state_delta={
                        "data_fusion_error": "Missing user_id"
                    })
                )
                return
            
            # Yield start event
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Fetching financial profile for user {user_id}...")])
            )
            
            # Fetch comprehensive financial profile (90 days of data)
            financial_profile = await fetch_user_financial_profile(user_id, days=90)
            
            # Validate profile has necessary data
            is_valid, validation_errors = validate_user_profile(financial_profile.get("user_profile", {}))
            
            if not is_valid:
                error_msg = f"Invalid user profile: {', '.join(validation_errors)}"
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text=error_msg)]),
                    actions=EventActions(state_delta={
                        "data_fusion_error": error_msg,
                        "validation_errors": validation_errors
                    })
                )
                return
            
            # Generate summary for logging
            profile = financial_profile["user_profile"]
            summary = (
                f"Financial Profile Loaded:\n"
                f"- Balance: ${profile['total_balance']:,.2f}\n"
                f"- Monthly Income: ${profile['monthly_income']:,.2f} ({profile['income_cadence']})\n"
                f"- Monthly Expenses: ${profile['average_monthly_expenses']:,.2f}\n"
                f"- Emergency Fund: {profile['emergency_fund_months']:.1f} months\n"
                f"- DTI Ratio: {profile['current_dti_ratio']:.1%}\n"
                f"- Categories Analyzed: {len(financial_profile['spending_by_category'])}\n"
                f"- Active Budgets: {len(financial_profile['active_budgets'])}"
            )
            
            # Write complete profile to session state
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=summary)]),
                actions=EventActions(state_delta={
                    "user_financial_profile": financial_profile,
                    "data_fusion_complete": True
                })
            )
            
        except Exception as e:
            error_msg = f"Data Fusion Agent failed: {str(e)}"
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=error_msg)]),
                actions=EventActions(state_delta={
                    "data_fusion_error": str(e),
                    "data_fusion_complete": False
                })
            )

