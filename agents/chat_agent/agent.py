"""Financial chat agent with database queries and visualization capabilities."""

from google.adk import Agent
from .config import LLM_MODEL
from .prompts import GLOBAL_INSTRUCTION, INSTRUCTION
from .user_context import UserContextWrapper, create_user_context_instruction

from .tools.database_tools import (
    get_recent_alerts,
    get_recent_insights,
    get_recent_transactions,
    get_account_balances,
    get_spending_by_category,
    get_budget_status,
    get_cashflow_summary,
    update_budget,
    create_budget,
    resolve_alert,
)

from .tools.visualization_tools import (
    generate_cashflow_projection_chart,
    generate_money_flow_sankey,
    generate_category_drift_chart,
    generate_top_merchants_pareto,
    generate_spending_heatmap,
    generate_subscription_analysis,
    generate_budget_scenario_chart,
    generate_budget_pace_chart,
    generate_category_volatility_scatter,
    generate_budget_breach_curve,
    generate_budget_manager,
)

# Base tools list (without user context)
BASE_TOOLS = [
    # Database query tools
    get_recent_alerts,
    get_recent_insights,
    get_recent_transactions,
    get_account_balances,
    get_spending_by_category,
    get_budget_status,
    get_cashflow_summary,
    update_budget,
    create_budget,
    resolve_alert,
    # Visualization tools
    generate_cashflow_projection_chart,
    generate_money_flow_sankey,
    generate_category_drift_chart,
    generate_top_merchants_pareto,
    generate_spending_heatmap,
    generate_subscription_analysis,
    generate_budget_scenario_chart,
    generate_budget_pace_chart,
    generate_category_volatility_scatter,
    generate_budget_breach_curve,
    generate_budget_manager,
]


def create_user_agent(user_id: str) -> Agent:
    """
    Creates a chat agent instance for a specific authenticated user.
    
    SECURITY: All tools are wrapped to automatically use the authenticated user_id.
    The LLM cannot override or specify a different user_id.
    
    Args:
        user_id: The authenticated user's ID
        
    Returns:
        Agent instance with user-scoped tools
    """
    # Create user context wrapper
    context = UserContextWrapper(user_id)
    
    # Wrap all tools with user context
    user_tools = context.wrap_all_tools(BASE_TOOLS)
    
    # Add user context to instructions
    user_context_instruction = create_user_context_instruction(user_id)
    enhanced_global_instruction = f"{GLOBAL_INSTRUCTION}\n\n{user_context_instruction}"
    
    # Create agent with user-scoped tools
    return Agent(
        model=LLM_MODEL,
        name="chat_agent",
        global_instruction=enhanced_global_instruction,
        instruction=INSTRUCTION,
        tools=user_tools
    )


# Default agent (for backward compatibility, but shouldn't be used directly)
root_agent = Agent(
    model=LLM_MODEL,
    name="chat_agent",
    global_instruction=GLOBAL_INSTRUCTION,
    instruction=INSTRUCTION,
    tools=BASE_TOOLS
)
