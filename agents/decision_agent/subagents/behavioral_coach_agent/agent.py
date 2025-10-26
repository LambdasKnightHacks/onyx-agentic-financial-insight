"""
Behavioral Coach Agent

Generates personalized budget rebalancing recommendations using LLM.

Inputs:
- user_financial_profile
- enriched_financial_context (with elasticity scores)
- tco_results (to determine required savings)

Outputs:
- budget_recommendations: List of actionable budget changes
"""

from typing import AsyncGenerator, Dict, Any
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part
import google.generativeai as genai
import os
import json

from .prompts import BEHAVIORAL_COACH_SYSTEM_PROMPT, get_behavioral_coach_prompt
from .tools import parse_llm_budget_recommendations, validate_budget_recommendations
from ...config import LLM_MODEL


class BehavioralCoachAgent(BaseAgent):
    """
    Behavioral Coach Agent - Generates personalized budget recommendations
    
    Uses LLM to create realistic, actionable budget adjustments based on:
    - User's actual spending patterns
    - Category elasticity scores
    - Required savings amount
    - Behavioral psychology principles
    """
    
    def __init__(self):
        super().__init__(
            name="behavioral_coach_agent",
            description="Generates personalized budget rebalancing recommendations using AI"
        )
        
        # Configure Gemini (model will be created in _run_async_impl)
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    
    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """
        Generate budget recommendations
        
        Expected session state:
        - user_financial_profile: Dict with financial metrics, spending patterns, and behavioral_profile
        - tco_results: List[Dict] with TCO calculations
        - decision_type: Type of decision
        """
        try:
            user_profile_data = ctx.session.state.get("user_financial_profile", {})
            tco_results = ctx.session.state.get("tco_results", [])
            decision_type = ctx.session.state.get("decision_type", "")
            
            if not user_profile_data or not tco_results:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Error: Missing required data for budget recommendations")]),
                    actions=EventActions(state_delta={
                        "behavioral_coach_error": "Missing required inputs"
                    })
                )
                return
            
            user_profile = user_profile_data.get("user_profile", {})
            spending_by_category = user_profile_data.get("spending_by_category", {})
            # ✅ FIX: behavioral_profile is inside user_financial_profile, not separate
            behavioral_profile = user_profile_data.get("behavioral_profile", {})
            elasticity_scores = behavioral_profile.get("elasticity_scores", {})
            
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text="Generating personalized budget recommendations...")])
            )
            
            # Determine which option needs budget recommendations (typically the recommended one)
            # For now, analyze the first option or the one with highest monthly payment
            target_option = max(tco_results, key=lambda x: x.get("monthly_equivalent", 0))
            monthly_payment = target_option.get("monthly_equivalent", 0)
            
            # Calculate required savings
            monthly_income = user_profile.get("monthly_income", 0)
            monthly_expenses = user_profile.get("average_monthly_expenses", 0)
            current_surplus = monthly_income - monthly_expenses
            
            # If adding this payment would put user in deficit, calculate needed cuts
            if current_surplus < monthly_payment:
                required_savings = monthly_payment - current_surplus
            else:
                # Even if affordable, suggest optimizations to maintain healthy buffer
                required_savings = max(0, monthly_payment * 0.3)  # Suggest freeing 30% of payment amount
            
            # Create simplified spending dict (category -> amount)
            spending_simple = {}
            for cat, details in spending_by_category.items():
                if isinstance(details, dict):
                    spending_simple[cat] = details.get("monthly_avg", 0)
                else:
                    spending_simple[cat] = details
            
            # Build prompt
            decision_description = f"{decision_type.replace('_', ' ').title()}: ${monthly_payment:.2f}/month"
            
            prompt = get_behavioral_coach_prompt(
                user_profile=user_profile,
                spending_by_category=spending_simple,
                elasticity_scores=elasticity_scores,
                decision_description=decision_description,
                monthly_payment=monthly_payment,
                required_savings=required_savings
            )
            
            # Call LLM
            try:
                # Create model instance here (can't store as instance variable due to Pydantic)
                model = genai.GenerativeModel(LLM_MODEL)
                response = model.generate_content(
                    [BEHAVIORAL_COACH_SYSTEM_PROMPT, prompt],
                    generation_config={
                        "temperature": 0.7,
                        "max_output_tokens": 2000
                    }
                )
                
                llm_output = response.text
                
            except Exception as llm_error:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text=f"LLM generation failed: {str(llm_error)}")]),
                    actions=EventActions(state_delta={
                        "behavioral_coach_error": str(llm_error)
                    })
                )
                return
            
            # Parse LLM output
            parse_result = parse_llm_budget_recommendations(llm_output)
            
            if not parse_result.get("success"):
                # Fallback: return empty recommendations
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text=f"Failed to parse recommendations: {parse_result.get('error')}")]),
                    actions=EventActions(state_delta={
                        "budget_recommendations": {
                            "recommendations": [],
                            "total_monthly_savings": 0,
                            "achievability_score": 0,
                            "summary": "Unable to generate recommendations"
                        },
                        "behavioral_coach_complete": True
                    })
                )
                return
            
            recommendations_data = parse_result["data"]
            
            # Validate recommendations
            validation = validate_budget_recommendations(
                recommendations_data.get("recommendations", []),
                required_savings
            )
            
            # Add metadata
            recommendations_data["required_savings"] = required_savings
            recommendations_data["validation"] = validation
            
            # Generate summary
            total_savings = recommendations_data.get("total_monthly_savings", 0)
            num_recs = len(recommendations_data.get("recommendations", []))
            summary = f"Generated {num_recs} budget recommendations totaling ${total_savings:.2f}/month in savings"
            
            # Write results to session state
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=summary)]),
                actions=EventActions(state_delta={
                    "budget_recommendations": recommendations_data,
                    "behavioral_coach_complete": True
                })
            )
            
        except Exception as e:
            error_msg = f"Behavioral Coach Agent failed: {str(e)}"
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=error_msg)]),
                actions=EventActions(state_delta={
                    "behavioral_coach_error": str(e),
                    "behavioral_coach_complete": False
                })
            )

