"""
Prompts for Synthesis Agent

LLM-powered prompts for generating final verdict and insights.
"""


SYNTHESIS_AGENT_SYSTEM_PROMPT = """You are a senior financial advisor synthesizing comprehensive analysis into a clear, actionable verdict.

Your role is to:
1. Review ALL agent outputs (TCO, risk, credit impact, opportunity cost, budget recommendations)
2. Determine the BEST option based on multiple factors
3. Explain your reasoning in clear, human terms
4. Provide specific action items

Output Format: JSON only, no additional text.
Be decisive but acknowledge trade-offs."""


def get_synthesis_prompt(
    decision_type: str,
    user_profile: dict,
    tco_results: list,
    risk_analysis: list,
    credit_analysis: list,
    opportunity_cost_analysis: list,
    budget_recommendations: dict
) -> str:
    """
    Generate prompt for final synthesis
    
    Args:
        decision_type: Type of decision
        user_profile: User's financial profile
        tco_results: TCO calculations for all options
        risk_analysis: Risk & liquidity analysis
        credit_analysis: Credit impact analysis
        opportunity_cost_analysis: Opportunity cost analysis
        budget_recommendations: Budget rebalancing recommendations
    
    Returns:
        Formatted prompt string
    """
    # Format option summaries
    options_summary = []
    for i, option in enumerate(tco_results):
        risk = risk_analysis[i] if i < len(risk_analysis) else {}
        credit = credit_analysis[i] if i < len(credit_analysis) else {}
        opp_cost = opportunity_cost_analysis[i] if i < len(opportunity_cost_analysis) else {}
        
        options_summary.append(f"""
Option: {option.get('name', 'Unknown')}
- TCO: ${option.get('tco_expected', 0):,.2f}
- Monthly Payment: ${option.get('monthly_equivalent', 0):.2f}
- Liquidity Score: {risk.get('liquidity_score', 0):.2f}
- Runway Days: {risk.get('runway_impact', {}).get('new_runway_days', 0)}
- Overall Risk: {risk.get('overall_risk', {}).get('overall_risk', 'unknown')}
- Credit Impact: {credit.get('impact_range', 'unknown')}
- Opportunity Cost: ${opp_cost.get('investment_opportunity_cost', {}).get('total_opportunity_cost', 0):,.2f}
""")
    
    options_text = "\n---".join(options_summary)
    
    prompt = f"""Decision Type: {decision_type.replace('_', ' ').title()}

User Context:
- Monthly Income: ${user_profile.get('monthly_income', 0):,.2f}
- Monthly Expenses: ${user_profile.get('average_monthly_expenses', 0):,.2f}
- Emergency Fund: {user_profile.get('emergency_fund_months', 0):.1f} months
- Current DTI: {user_profile.get('current_dti_ratio', 0):.1%}

Options Analysis:
{options_text}

Budget Recommendations Available:
- Total Savings Potential: ${budget_recommendations.get('total_monthly_savings', 0):.2f}/month
- Achievability: {budget_recommendations.get('achievability_score', 0):.0%}

Task: Synthesize this analysis and provide a CLEAR, DECISIVE recommendation.

Consider:
1. Total Cost of Ownership (TCO) - lower is better
2. Liquidity & Risk - adequate emergency fund, acceptable runway
3. Credit Impact - manageable short-term impact
4. Opportunity Cost - alternative uses of money
5. Lifestyle Impact - budget recommendations achievability

Output ONLY this JSON structure (no other text):
{{
  "recommended_option": "Finance",
  "confidence": 0.78,
  "reasoning": "Brief 1-2 sentence explanation of why this option wins",
  "risk_level": "low",
  "key_factors": [
    "Most important factor (e.g., 'APR advantage saves $2,100 over 36 months')",
    "Second most important factor",
    "Third most important factor"
  ],
  "trade_offs": [
    "What user gives up by choosing this option",
    "Another trade-off to consider"
  ],
  "action_checklist": [
    "Specific action item 1 (e.g., 'Get preapproval from 2-3 lenders')",
    "Specific action item 2",
    "Specific action item 3"
  ],
  "sensitivity_factors": [
    "Variable that could change the recommendation (e.g., 'If APR increases by 1%, lease becomes better')"
  ]
}}

Risk Level Guidelines:
- "low": User can comfortably afford, minimal stress test failures, emergency fund intact
- "medium": Tight but manageable, some stress test warnings, requires budget adjustments
- "high": Significant risk, multiple stress test failures, depletes emergency fund

Confidence Guidelines:
- 0.9+: Clear winner, all metrics favor one option
- 0.7-0.9: Strong recommendation, most metrics favor one option
- 0.5-0.7: Moderate preference, trade-offs exist
- <0.5: Too close to call, defer to user preferences"""
    
    return prompt

