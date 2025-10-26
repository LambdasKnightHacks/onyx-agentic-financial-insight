"""Financial chat agent with database queries and visualization capabilities."""

from google.adk import Agent
from .config import LLM_MODEL
from .prompts import GLOBAL_INSTRUCTION, INSTRUCTION

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
)

# Chat Agent (root)
root_agent = Agent(
    model=LLM_MODEL,
    name="chat_agent",
    global_instruction=GLOBAL_INSTRUCTION,
    instruction=INSTRUCTION,
    tools=[
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
    ]
)
