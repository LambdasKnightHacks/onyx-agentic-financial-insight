"""
Prompts for Behavioral Coach Agent

LLM-powered prompts for generating personalized budget recommendations.
"""


BEHAVIORAL_COACH_SYSTEM_PROMPT = """You are an expert financial coach specializing in behavior change and budget optimization.

Your role is to help users afford major financial decisions by providing realistic, sustainable budget adjustments.

Key Principles:
1. Focus on HIGH-ELASTICITY categories (dining, entertainment, shopping, subscriptions)
2. Avoid recommending cuts to INELASTIC categories (rent, utilities, insurance)
3. Provide SPECIFIC, ACTIONABLE changes with exact dollar amounts
4. Suggest BEHAVIORAL shifts, not deprivation (e.g., "meal prep Sundays" not "stop eating out")
5. Prioritize changes with LOWEST LIFESTYLE IMPACT
6. Base recommendations on USER'S ACTUAL SPENDING PATTERNS

Output Format: JSON only, no additional text."""


def get_behavioral_coach_prompt(
    user_profile: dict,
    spending_by_category: dict,
    elasticity_scores: dict,
    decision_description: str,
    monthly_payment: float,
    required_savings: float
) -> str:
    """
    Generate personalized prompt for budget rebalancing
    
    Args:
        user_profile: User's financial profile
        spending_by_category: Current spending by category
        elasticity_scores: Elasticity score for each category (0-1)
        decision_description: Description of the decision
        monthly_payment: New monthly payment amount
        required_savings: Amount user needs to save monthly
    
    Returns:
        Formatted prompt string
    """
    # Format elasticity scores for readability
    elasticity_formatted = "\n".join([
        f"  - {cat}: {score:.2f} ({'High flexibility' if score > 0.6 else 'Medium flexibility' if score > 0.3 else 'Low flexibility'})"
        for cat, score in sorted(elasticity_scores.items(), key=lambda x: x[1], reverse=True)
    ])
    
    # Format current spending
    spending_formatted = "\n".join([
        f"  - {cat}: ${amount:.2f}/month"
        for cat, amount in sorted(spending_by_category.items(), key=lambda x: x[1], reverse=True)
    ])
    
    prompt = f"""User's Financial Profile:
- Monthly Income: ${user_profile.get('monthly_income', 0):.2f}
- Current Monthly Expenses: ${user_profile.get('average_monthly_expenses', 0):.2f}
- Monthly Surplus: ${user_profile.get('monthly_income', 0) - user_profile.get('average_monthly_expenses', 0):.2f}

Current Spending by Category:
{spending_formatted}

Category Elasticity (1.0 = highly flexible, can easily cut; 0.0 = fixed, cannot cut):
{elasticity_formatted}

Decision: {decision_description}
New Monthly Payment: ${monthly_payment:.2f}
Additional Savings Needed: ${required_savings:.2f}/month

Task: Generate 3-5 realistic budget recommendations to free up ${required_savings:.2f}/month or more.

Requirements:
1. Focus ONLY on high-elasticity categories (score > 0.5)
2. Each recommendation must include:
   - category (e.g., "food")
   - subcategory (e.g., "dining")
   - action (e.g., "reduce")
   - current_monthly (current spending)
   - suggested_monthly (new spending target)
   - monthly_savings (difference)
   - specific_change (e.g., "Skip 2 restaurant meals per month")
   - behavioral_tip (e.g., "Meal prep on Sundays, try new recipes at home")
   - difficulty ("easy", "medium", "hard")
   - lifestyle_impact ("low", "medium", "high")
3. Total savings must meet or exceed ${required_savings:.2f}
4. Prioritize "easy" difficulty and "low" lifestyle_impact changes first

Output ONLY this JSON structure (no other text):
{{
  "recommendations": [
    {{
      "category": "food",
      "subcategory": "dining",
      "action": "reduce",
      "current_monthly": 600,
      "suggested_monthly": 500,
      "monthly_savings": 100,
      "specific_change": "Skip 2 restaurant meals per month",
      "behavioral_tip": "Meal prep on Sundays, try new recipes at home",
      "difficulty": "easy",
      "lifestyle_impact": "low"
    }}
  ],
  "total_monthly_savings": 250,
  "achievability_score": 0.85,
  "summary": "By making these changes, you can free up $250/month with minimal lifestyle disruption."
}}"""
    
    return prompt

