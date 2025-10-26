""" Tools for the chat agent """

from .database_tools import (
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

from .visualization_tools import (
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
    generate_income_expense_comparison,
    generate_subcategory_comparison,
)

__all__ = [
    # Database tools
    "get_recent_alerts",
    "get_recent_insights",
    "get_recent_transactions",
    "get_account_balances",
    "get_spending_by_category",
    "get_budget_status",
    "get_cashflow_summary",
    "update_budget",
    "create_budget",
    "resolve_alert",
    # Visualization tools
    "generate_cashflow_projection_chart",
    "generate_money_flow_sankey",
    "generate_category_drift_chart",
    "generate_top_merchants_pareto",
    "generate_spending_heatmap",
    "generate_subscription_analysis",
    "generate_budget_scenario_chart",
    "generate_budget_pace_chart",
    "generate_category_volatility_scatter",
    "generate_budget_breach_curve",
    "generate_income_expense_comparison",
    "generate_subcategory_comparison",
]

