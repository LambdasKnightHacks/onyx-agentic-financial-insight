""" Visualization data processing tools for the chat agent

These tools process financial data and return Recharts-compatible chart configurations.
All functions return a consistent format:
{
    "success": bool,
    "chart_type": str,
    "data": list[dict],
    "config": dict,
    "metadata": dict
}
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

import pandas as pd
import numpy as np
from chat_agent.config import get_supabase_client

# HELPER FUNCTIONS

def _format_currency(amount: float) -> str:
    """Format amount as currency string."""
    return f"${amount:,.2f}"


def _get_color_palette():
    """Return consistent color palette for charts."""
    return {
        "primary": "#8884d8",
        "secondary": "#82ca9d",
        "tertiary": "#ffc658",
        "danger": "#ff6b6b",
        "warning": "#ffa94d",
        "success": "#51cf66",
        "info": "#4dabf7",
        "neutral": "#868e96"
    }


def _get_category_color(category: str) -> str:
    """Get consistent color for category."""
    colors = {
        "food": "#ff6b6b",
        "transportation": "#4dabf7",
        "shopping": "#ffc658",
        "entertainment": "#9775fa",
        "healthcare": "#51cf66",
        "income": "#20c997",
        "living": "#868e96",
        "financial": "#fd7e14",
        "education": "#74c0fc",
        "travel": "#ff8787"
    }
    return colors.get(category.lower(), "#8884d8")

# VISUALIZATION TOOLS

async def generate_cashflow_projection_chart(
    user_id: str, 
    days: int = 60
) -> dict:
    """
    Generate cashflow runway projection area chart.
    
    Shows projected balance over the next N days based on spending trends.
    
    Args:
        user_id: User ID
        days: Number of days to project forward (default 60)
    
    Returns:
        Area chart config with projected balance and runway threshold
    """
    try:
        supabase = get_supabase_client()
        
        # Get current balance
        accounts_response = supabase.table("accounts").select(
            "id"
        ).eq("user_id", user_id).execute()
        
        if not accounts_response.data:
            return {
                "success": False,
                "error": "No accounts found",
                "summary": "Link a bank account to see cashflow projections."
            }
        
        account_id = accounts_response.data[0]["id"]
        balance_response = supabase.table("account_balances").select(
            "current"
        ).eq("account_id", account_id).order("as_of", desc=True).limit(1).execute()
        
        current_balance = balance_response.data[0]["current"] if balance_response.data else 1000
        
        # Get spending rate from last 30 days
        date_threshold = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        transactions_response = supabase.table("transactions").select(
            "amount, posted_at"
        ).eq("user_id", user_id).gte("posted_at", date_threshold).execute()
        
        if not transactions_response.data:
            return {
                "success": False,
                "error": "No transaction data",
                "summary": "Not enough transaction history to project cashflow."
            }
        
        # Calculate daily spending rate
        df = pd.DataFrame(transactions_response.data)
        df['amount'] = df['amount'].abs()
        daily_spending = df['amount'].sum() / 30  # average per day
        
        # Project forward
        projection_data = []
        current_date = datetime.now()
        projected_balance = current_balance
        
        for day in range(days + 1):
            date = current_date + timedelta(days=day)
            projected_balance -= daily_spending
            
            projection_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "day": day,
                "balance": round(projected_balance, 2),
                "threshold": 0,  # runway threshold line
                "warning_zone": round(current_balance * 0.2, 2)  # 20% threshold
            })
        
        # Find runway days (when balance hits zero)
        runway_days = next(
            (d["day"] for d in projection_data if d["balance"] <= 0),
            days
        )
        
        colors = _get_color_palette()
        
        return {
            "success": True,
            "chart_type": "area",
            "data": projection_data,
            "config": {
                "xAxis": {
                    "dataKey": "day",
                    "label": "Days from Today",
                    "type": "number"
                },
                "yAxis": {
                    "label": "Projected Balance ($)",
                    "tickFormatter": "currency"
                },
                "series": [
                    {
                        "dataKey": "balance",
                        "name": "Projected Balance",
                        "stroke": colors["primary"],
                        "fill": colors["primary"],
                        "fillOpacity": 0.3
                    },
                    {
                        "dataKey": "warning_zone",
                        "name": "Warning Zone",
                        "stroke": colors["warning"],
                        "strokeDasharray": "5 5",
                        "fill": "none"
                    }
                ],
                "tooltip": {"enabled": True},
                "legend": {"enabled": True}
            },
            "metadata": {
                "title": f"{days}-Day Cashflow Projection",
                "description": f"Based on your average daily spending of {_format_currency(daily_spending)}",
                "insights": [
                    f"Current balance: {_format_currency(current_balance)}",
                    f"Runway: {runway_days} days",
                    f"Daily burn rate: {_format_currency(daily_spending)}"
                ]
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": f"Failed to generate cashflow projection: {str(e)}"
        }


async def generate_money_flow_sankey(
    user_id: str, 
    month: Optional[str] = None
) -> dict:
    """
    Generate Sankey diagram showing money flow: income → categories → merchants.
    
    Args:
        user_id: User ID
        month: Optional month in YYYY-MM format (default: current month)
    
    Returns:
        Sankey chart config with nodes and links
    """
    try:
        supabase = get_supabase_client()
        
        # Parse month
        if month:
            target_month = datetime.strptime(month, "%Y-%m")
        else:
            target_month = datetime.now().replace(day=1)
        
        start_date = target_month.strftime("%Y-%m-01")
        next_month = (target_month + timedelta(days=32)).replace(day=1)
        end_date = next_month.strftime("%Y-%m-01")
        
        # Get transactions for the month
        response = supabase.table("transactions").select(
            "amount, category, merchant_name, payment_channel"
        ).eq("user_id", user_id).gte("posted_at", start_date).lt("posted_at", end_date).execute()
        
        if not response.data:
            return {
                "success": False,
                "error": "No data for selected month",
                "summary": f"No transactions found for {target_month.strftime('%B %Y')}"
            }
        
        df = pd.DataFrame(response.data)
        
        # Separate income and expenses
        income_total = df[df['amount'] > 0]['amount'].sum()
        expenses = df[df['amount'] < 0].copy()
        expenses['amount'] = expenses['amount'].abs()
        
        # Group by category
        category_totals = expenses.groupby('category')['amount'].sum().to_dict()
        
        # Get top 5 merchants per category
        merchant_data = []
        for category in category_totals.keys():
            cat_merchants = expenses[expenses['category'] == category].groupby(
                'merchant_name'
            )['amount'].sum().nlargest(3)
            for merchant, amount in cat_merchants.items():
                merchant_data.append({
                    "category": category,
                    "merchant": merchant or "Unknown",
                    "amount": round(amount, 2)
                })
        
        # Build Sankey nodes and links
        nodes = [{"name": "Income", "id": "income"}]
        links = []
        node_id = 1
        
        # Add category nodes and links from income
        category_ids = {}
        for category, amount in category_totals.items():
            cat_id = f"cat_{node_id}"
            category_ids[category] = cat_id
            nodes.append({"name": category or "Other", "id": cat_id})
            links.append({
                "source": "income",
                "target": cat_id,
                "value": round(amount, 2)
            })
            node_id += 1
        
        # Add merchant nodes and links from categories
        for item in merchant_data:
            merchant_id = f"merch_{node_id}"
            nodes.append({"name": item["merchant"], "id": merchant_id})
            links.append({
                "source": category_ids.get(item["category"], "income"),
                "target": merchant_id,
                "value": item["amount"]
            })
            node_id += 1
        
        return {
            "success": True,
            "chart_type": "sankey",
            "data": {
                "nodes": nodes,
                "links": links
            },
            "config": {
                "nodeWidth": 20,
                "nodePadding": 20,
                "linkOpacity": 0.5
            },
            "metadata": {
                "title": f"Money Flow - {target_month.strftime('%B %Y')}",
                "description": "How your money flows from income to categories to merchants",
                "insights": [
                    f"Total income: {_format_currency(income_total)}",
                    f"Total expenses: {_format_currency(sum(category_totals.values()))}",
                    f"Categories: {len(category_totals)}"
                ]
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": f"Failed to generate money flow diagram: {str(e)}"
        }


async def generate_category_drift_chart(user_id: str) -> dict:
    """
    Generate slope chart showing category spending drift (last month vs this month).
    
    Args:
        user_id: User ID
    
    Returns:
        Slope chart config showing month-over-month changes
    """
    try:
        supabase = get_supabase_client()
        
        # Get this month and last month dates
        now = datetime.now()
        this_month_start = now.replace(day=1).strftime("%Y-%m-%d")
        last_month_start = (now.replace(day=1) - timedelta(days=1)).replace(day=1).strftime("%Y-%m-%d")
        last_month_end = now.replace(day=1).strftime("%Y-%m-%d")
        
        # Get last month transactions
        last_month_response = supabase.table("transactions").select(
            "category, amount"
        ).eq("user_id", user_id).gte(
            "posted_at", last_month_start
        ).lt("posted_at", last_month_end).execute()
        
        # Get this month transactions
        this_month_response = supabase.table("transactions").select(
            "category, amount"
        ).eq("user_id", user_id).gte("posted_at", this_month_start).execute()
        
        if not last_month_response.data or not this_month_response.data:
            return {
                "success": False,
                "error": "Insufficient data",
                "summary": "Need at least 2 months of data to show spending trends."
            }
        
        # Process data
        last_month_df = pd.DataFrame(last_month_response.data)
        this_month_df = pd.DataFrame(this_month_response.data)
        
        last_month_df['amount'] = last_month_df['amount'].abs()
        this_month_df['amount'] = this_month_df['amount'].abs()
        
        last_month_totals = last_month_df.groupby('category')['amount'].sum()
        this_month_totals = this_month_df.groupby('category')['amount'].sum()
        
        # Combine and calculate changes
        categories = set(list(last_month_totals.index) + list(this_month_totals.index))
        drift_data = []
        
        for category in categories:
            last_amount = last_month_totals.get(category, 0)
            this_amount = this_month_totals.get(category, 0)
            change = this_amount - last_amount
            change_pct = (change / last_amount * 100) if last_amount > 0 else 0
            
            drift_data.append({
                "category": category or "Other",
                "last_month": round(last_amount, 2),
                "this_month": round(this_amount, 2),
                "change": round(change, 2),
                "change_pct": round(change_pct, 1),
                "color": _get_category_color(category)
            })
        
        # Sort by absolute change percentage
        drift_data.sort(key=lambda x: abs(x["change_pct"]), reverse=True)
        
        return {
            "success": True,
            "chart_type": "slope",
            "data": drift_data[:10],  # Top 10 categories
            "config": {
                "xAxis": {
                    "dataKey": "category",
                    "type": "category"
                },
                "yAxis": {
                    "label": "Spending ($)",
                    "tickFormatter": "currency"
                },
                "lines": [
                    {"dataKey": "last_month", "name": "Last Month", "stroke": "#94a3b8"},
                    {"dataKey": "this_month", "name": "This Month", "stroke": "#3b82f6"}
                ]
            },
            "metadata": {
                "title": "Category Spending Drift",
                "description": "Month-over-month spending changes by category",
                "insights": [
                    f"Biggest increase: {drift_data[0]['category']} (+{drift_data[0]['change_pct']:.1f}%)" if drift_data else "No data",
                    f"Categories tracked: {len(drift_data)}"
                ]
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": f"Failed to generate category drift chart: {str(e)}"
        }


async def generate_top_merchants_pareto(
    user_id: str, 
    days: int = 30
) -> dict:
    """
    Generate Pareto chart showing top merchants (bar + cumulative line).
    
    Args:
        user_id: User ID
        days: Number of days to analyze (default 30)
    
    Returns:
        Composed chart (bar + line) showing 80/20 merchant analysis
    """
    try:
        supabase = get_supabase_client()
        
        date_threshold = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        # Get transactions
        response = supabase.table("transactions").select(
            "merchant_name, amount"
        ).eq("user_id", user_id).gte("posted_at", date_threshold).execute()
        
        if not response.data:
            return {
                "success": False,
                "error": "No transaction data",
                "summary": f"No transactions found in the last {days} days."
            }
        
        # Process data
        df = pd.DataFrame(response.data)
        df['amount'] = df['amount'].abs()
        
        # Group by merchant and get top 10
        merchant_totals = df.groupby('merchant_name')['amount'].sum().nlargest(10)
        total_spending = df['amount'].sum()
        
        # Calculate cumulative percentage
        pareto_data = []
        cumulative = 0
        
        for merchant, amount in merchant_totals.items():
            cumulative += amount
            cumulative_pct = (cumulative / total_spending) * 100
            
            pareto_data.append({
                "merchant": merchant or "Unknown",
                "amount": round(amount, 2),
                "cumulative_pct": round(cumulative_pct, 1),
                "pct_of_total": round((amount / total_spending) * 100, 1)
            })
        
        colors = _get_color_palette()
        
        return {
            "success": True,
            "chart_type": "composed",
            "data": pareto_data,
            "config": {
                "xAxis": {
                    "dataKey": "merchant",
                    "type": "category",
                    "angle": -45,
                    "textAnchor": "end"
                },
                "yAxis": [
                    {
                        "yAxisId": "left",
                        "label": "Spending ($)",
                        "tickFormatter": "currency"
                    },
                    {
                        "yAxisId": "right",
                        "orientation": "right",
                        "label": "Cumulative %",
                        "domain": [0, 100]
                    }
                ],
                "bars": [
                    {
                        "dataKey": "amount",
                        "name": "Spending",
                        "fill": colors["primary"],
                        "yAxisId": "left"
                    }
                ],
                "lines": [
                    {
                        "dataKey": "cumulative_pct",
                        "name": "Cumulative %",
                        "stroke": colors["danger"],
                        "yAxisId": "right",
                        "strokeWidth": 2
                    }
                ]
            },
            "metadata": {
                "title": "Top 10 Merchants (Pareto Analysis)",
                "description": f"Top merchants account for {pareto_data[0]['cumulative_pct']:.0f}% of spending",
                "insights": [
                    f"Top merchant: {pareto_data[0]['merchant']} ({_format_currency(pareto_data[0]['amount'])})",
                    f"Top 3 account for {pareto_data[2]['cumulative_pct']:.0f}% of total spending"
                ]
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": f"Failed to generate Pareto chart: {str(e)}"
        }


async def generate_spending_heatmap(
    user_id: str,
    heatmap_type: str = "calendar"
) -> dict:
    """
    Generate spending heatmap (calendar or hourly).
    
    Args:
        user_id: User ID
        heatmap_type: Type of heatmap ("calendar" for day-of-month, "hourly" for hour-of-week)
    
    Returns:
        Heatmap data suitable for custom rendering
    """
    try:
        supabase = get_supabase_client()
        
        # Get last 60 days of transactions
        date_threshold = (datetime.now() - timedelta(days=60)).strftime("%Y-%m-%d")
        
        response = supabase.table("transactions").select(
            "amount, posted_at"
        ).eq("user_id", user_id).gte("posted_at", date_threshold).execute()
        
        if not response.data:
            return {
                "success": False,
                "error": "No transaction data",
                "summary": "Not enough transaction history for heatmap."
            }
        
        df = pd.DataFrame(response.data)
        df['amount'] = df['amount'].abs()
        df['posted_at'] = pd.to_datetime(df['posted_at'])
        
        if heatmap_type == "calendar":
            # Day of month heatmap
            df['day'] = df['posted_at'].dt.day
            df['month'] = df['posted_at'].dt.strftime("%b")
            
            heatmap_data = df.groupby(['month', 'day'])['amount'].sum().reset_index()
            heatmap_data['amount'] = heatmap_data['amount'].round(2)
            
            # Convert to list of dicts
            data_points = heatmap_data.to_dict('records')
            
            return {
                "success": True,
                "chart_type": "heatmap",
                "subtype": "calendar",
                "data": data_points,
                "config": {
                    "xAxis": "day",
                    "yAxis": "month",
                    "value": "amount",
                    "colorScale": "YlOrRd"
                },
                "metadata": {
                    "title": "Spending Calendar Heatmap",
                    "description": "Daily spending patterns across months"
                }
            }
        else:  # hourly
            # Hour of week heatmap (requires transaction timestamp, not just date)
            # For now, use day of week as approximation
            df['weekday'] = df['posted_at'].dt.day_name()
            df['hour'] = df['posted_at'].dt.hour
            
            heatmap_data = df.groupby(['weekday', 'hour'])['amount'].sum().reset_index()
            heatmap_data['amount'] = heatmap_data['amount'].round(2)
            
            data_points = heatmap_data.to_dict('records')
            
            return {
                "success": True,
                "chart_type": "heatmap",
                "subtype": "hourly",
                "data": data_points,
                "config": {
                    "xAxis": "hour",
                    "yAxis": "weekday",
                    "value": "amount",
                    "colorScale": "Blues"
                },
                "metadata": {
                    "title": "Spending Time Heatmap",
                    "description": "When you spend most during the week"
                }
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": f"Failed to generate heatmap: {str(e)}"
        }


async def generate_subscription_analysis(user_id: str) -> dict:
    """
    Analyze recurring subscriptions/payments.
    
    Detects subscriptions by finding recurring transactions to same merchant.
    
    Args:
        user_id: User ID
    
    Returns:
        Multi-part response with subscription table + trend chart
    """
    try:
        supabase = get_supabase_client()
        
        # Get last 90 days to detect patterns
        date_threshold = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
        
        response = supabase.table("transactions").select(
            "merchant_name, amount, posted_at"
        ).eq("user_id", user_id).gte("posted_at", date_threshold).execute()
        
        if not response.data:
            return {
                "success": False,
                "error": "No transaction data",
                "summary": "Not enough transaction history to detect subscriptions."
            }
        
        df = pd.DataFrame(response.data)
        df['amount'] = df['amount'].abs()
        df['posted_at'] = pd.to_datetime(df['posted_at'])
        
        # Detect recurring payments (same merchant, similar amount, multiple occurrences)
        subscriptions = []
        
        for merchant, group in df.groupby('merchant_name'):
            if len(group) < 2:
                continue
            
            # Check if amounts are similar (within 10%)
            mean_amount = group['amount'].mean()
            std_amount = group['amount'].std()
            
            if std_amount / mean_amount < 0.1:  # Low variance = subscription
                frequency = len(group) / 3  # per month (90 days = 3 months)
                
                subscriptions.append({
                    "merchant": merchant or "Unknown",
                    "amount": round(mean_amount, 2),
                    "frequency": round(frequency, 1),
                    "total_paid": round(group['amount'].sum(), 2),
                    "count": len(group)
                })
        
        # Sort by amount
        subscriptions.sort(key=lambda x: x["amount"], reverse=True)
        
        # Generate trend data (monthly totals)
        df['month'] = df['posted_at'].dt.to_period('M').astype(str)
        trend_data = df.groupby('month')['amount'].sum().reset_index()
        trend_data.columns = ['month', 'total']
        trend_data['total'] = trend_data['total'].round(2)
        
        total_monthly_subscriptions = sum(s["amount"] * s["frequency"] for s in subscriptions)
        
        return {
            "success": True,
            "chart_type": "multi",
            "data": {
                "table_data": subscriptions[:10],  # Top 10 subscriptions
                "trend_data": trend_data.to_dict('records')
            },
            "config": {
                "chart_type": "bar",
                "xAxis": {"dataKey": "month"},
                "yAxis": {"label": "Total ($)"},
                "bars": [{"dataKey": "total", "fill": "#8884d8"}]
            },
            "metadata": {
                "title": "Subscription Analysis",
                "description": "Detected recurring payments and spending trends",
                "insights": [
                    f"Detected {len(subscriptions)} recurring payments",
                    f"Monthly subscription cost: {_format_currency(total_monthly_subscriptions)}",
                    f"Total paid in 90 days: {_format_currency(sum(s['total_paid'] for s in subscriptions))}"
                ]
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": f"Failed to analyze subscriptions: {str(e)}"
        }


async def generate_budget_scenario_chart(
    user_id: str,
    scenarios: Optional[List[Dict[str, Any]]] = None
) -> dict:
    """
    Generate waterfall chart showing budget scenarios.
    
    Args:
        user_id: User ID
        scenarios: List of scenario changes, e.g., [{"category": "dining", "change": -200}]
    
    Returns:
        Waterfall chart showing baseline → scenarios → net result
    """
    try:
        supabase = get_supabase_client()
        
        # Get current month spending
        month_start = datetime.now().replace(day=1).strftime("%Y-%m-%d")
        
        response = supabase.table("transactions").select(
            "category, amount"
        ).eq("user_id", user_id).gte("posted_at", month_start).execute()
        
        if not response.data:
            return {
                "success": False,
                "error": "No current month data",
                "summary": "No transactions this month to create scenarios."
            }
        
        df = pd.DataFrame(response.data)
        df['amount'] = df['amount'].abs()
        baseline_total = df['amount'].sum()
        
        # Build waterfall data
        waterfall_data = [
            {
                "label": "Current Spending",
                "value": round(baseline_total, 2),
                "cumulative": round(baseline_total, 2),
                "type": "baseline"
            }
        ]
        
        cumulative = baseline_total
        
        if scenarios:
            for scenario in scenarios:
                category = scenario.get("category", "Unknown")
                change = scenario.get("change", 0)
                cumulative += change
                
                waterfall_data.append({
                    "label": f"{category} {'+' if change > 0 else ''}{_format_currency(change)}",
                    "value": change,
                    "cumulative": round(cumulative, 2),
                    "type": "change"
                })
        
        # Add final total
        waterfall_data.append({
            "label": "Projected Total",
            "value": round(cumulative, 2),
            "cumulative": round(cumulative, 2),
            "type": "total"
        })
        
        savings = baseline_total - cumulative
        
        return {
            "success": True,
            "chart_type": "waterfall",
            "data": waterfall_data,
            "config": {
                "xAxis": {"dataKey": "label", "type": "category"},
                "yAxis": {"label": "Amount ($)", "tickFormatter": "currency"}
            },
            "metadata": {
                "title": "Budget Scenario Analysis",
                "description": "Impact of spending changes on your budget",
                "insights": [
                    f"Current spending: {_format_currency(baseline_total)}",
                    f"Projected spending: {_format_currency(cumulative)}",
                    f"Potential savings: {_format_currency(savings)}" if savings > 0 else f"Increased spending: {_format_currency(abs(savings))}"
                ]
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": f"Failed to generate scenario chart: {str(e)}"
        }


async def generate_budget_pace_chart(
    user_id: str,
    category: Optional[str] = None
) -> dict:
    """
    Generate budget pace chart showing actual vs budget allocation.
    
    Shows if you're on track to stay under budget this month.
    
    Args:
        user_id: User ID
        category: Optional category to focus on (default: all budgets)
    
    Returns:
        Line chart with cumulative spend vs linear budget line
    """
    try:
        supabase = get_supabase_client()
        
        # Get active budgets
        budget_query = supabase.table("budgets").select(
            "category, cap_amount, period"
        ).eq("user_id", user_id).eq("is_active", True)
        
        if category:
            budget_query = budget_query.eq("category", category)
        
        budgets = budget_query.execute()
        
        if not budgets.data:
            return {
                "success": False,
                "error": "No active budgets",
                "summary": "Set up a budget to track your spending pace."
            }
        
        budget = budgets.data[0]
        target_category = budget["category"]
        budget_cap = budget["cap_amount"]
        
        # Get current month transactions
        now = datetime.now()
        month_start = now.replace(day=1)
        days_in_month = (month_start.replace(month=month_start.month % 12 + 1, day=1) - timedelta(days=1)).day
        current_day = now.day
        
        # Get transactions for this category this month
        response = supabase.table("transactions").select(
            "amount, posted_at"
        ).eq("user_id", user_id).eq("category", target_category).gte(
            "posted_at", month_start.strftime("%Y-%m-%d")
        ).execute()
        
        if not response.data:
            return {
                "success": False,
                "error": "No transaction data",
                "summary": f"No {target_category} transactions this month."
            }
        
        # Process transactions
        df = pd.DataFrame(response.data)
        df['amount'] = df['amount'].abs()
        df['posted_at'] = pd.to_datetime(df['posted_at'])
        df['day'] = df['posted_at'].dt.day
        
        # Calculate cumulative spending by day
        daily_spending = df.groupby('day')['amount'].sum().sort_index()
        cumulative_spending = daily_spending.cumsum()
        
        # Generate pace data
        pace_data = []
        daily_budget = budget_cap / days_in_month
        
        for day in range(1, days_in_month + 1):
            actual = cumulative_spending.get(day, cumulative_spending[cumulative_spending.index < day].iloc[-1] if len(cumulative_spending[cumulative_spending.index < day]) > 0 else 0)
            linear_budget = daily_budget * day
            
            # Project to end of month
            if day <= current_day:
                projected = None
            else:
                # Simple projection based on current pace
                current_total = cumulative_spending.iloc[-1] if len(cumulative_spending) > 0 else 0
                daily_rate = current_total / current_day if current_day > 0 else 0
                projected = current_total + (daily_rate * (day - current_day))
            
            pace_data.append({
                "day": day,
                "actual": round(float(actual), 2) if day <= current_day else None,
                "budget_line": round(linear_budget, 2),
                "projected": round(projected, 2) if projected else None,
                "budget_cap": budget_cap
            })
        
        # Calculate if on pace
        current_spending = cumulative_spending.iloc[-1] if len(cumulative_spending) > 0 else 0
        expected_at_day = (budget_cap / days_in_month) * current_day
        on_pace = current_spending <= expected_at_day
        
        colors = _get_color_palette()
        
        return {
            "success": True,
            "chart_type": "line",
            "data": pace_data,
            "config": {
                "xAxis": {"dataKey": "day", "label": "Day of Month"},
                "yAxis": {"label": "Cumulative Spending ($)", "tickFormatter": "currency"},
                "lines": [
                    {
                        "dataKey": "actual",
                        "name": "Actual Spending",
                        "stroke": colors["primary"],
                        "strokeWidth": 2
                    },
                    {
                        "dataKey": "budget_line",
                        "name": "Budget Pace",
                        "stroke": colors["success"],
                        "strokeDasharray": "5 5"
                    },
                    {
                        "dataKey": "projected",
                        "name": "Projected",
                        "stroke": colors["warning"],
                        "strokeDasharray": "3 3"
                    }
                ]
            },
            "metadata": {
                "title": f"{target_category.title()} Budget Pace",
                "description": "Are you on track to stay within budget?",
                "insights": [
                    f"Budget: {_format_currency(budget_cap)}",
                    f"Spent so far: {_format_currency(current_spending)}",
                    f"Status: {'✅ On pace' if on_pace else '⚠️ Over pace'}"
                ]
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": f"Failed to generate budget pace chart: {str(e)}"
        }


async def generate_category_volatility_scatter(user_id: str) -> dict:
    """
    Generate scatter plot showing category volatility (mean vs std deviation).
    
    Helps identify which categories have unpredictable spending.
    
    Args:
        user_id: User ID
    
    Returns:
        Scatter chart with quadrant analysis
    """
    try:
        supabase = get_supabase_client()
        
        # Get last 90 days
        date_threshold = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
        
        response = supabase.table("transactions").select(
            "category, amount, posted_at"
        ).eq("user_id", user_id).gte("posted_at", date_threshold).execute()
        
        if not response.data:
            return {
                "success": False,
                "error": "No transaction data",
                "summary": "Need at least 90 days of data for volatility analysis."
            }
        
        df = pd.DataFrame(response.data)
        df['amount'] = df['amount'].abs()
        
        # Calculate mean and std dev per category
        volatility_data = []
        
        for category, group in df.groupby('category'):
            if len(group) < 3:  # Need minimum transactions for meaningful stats
                continue
            
            mean_amount = group['amount'].mean()
            std_amount = group['amount'].std()
            
            volatility_data.append({
                "category": category or "Other",
                "mean": round(mean_amount, 2),
                "stddev": round(std_amount, 2),
                "coefficient_of_variation": round((std_amount / mean_amount) * 100, 1) if mean_amount > 0 else 0,
                "transaction_count": len(group),
                "color": _get_category_color(category)
            })
        
        if not volatility_data:
            return {
                "success": False,
                "error": "Insufficient data",
                "summary": "Not enough transactions to analyze volatility."
            }
        
        # Calculate quadrants (median split)
        mean_values = [d["mean"] for d in volatility_data]
        stddev_values = [d["stddev"] for d in volatility_data]
        
        median_mean = np.median(mean_values)
        median_stddev = np.median(stddev_values)
        
        # Assign quadrants
        for item in volatility_data:
            if item["mean"] >= median_mean and item["stddev"] <= median_stddev:
                item["quadrant"] = "High Spend, Low Volatility"
            elif item["mean"] >= median_mean and item["stddev"] > median_stddev:
                item["quadrant"] = "High Spend, High Volatility"
            elif item["mean"] < median_mean and item["stddev"] <= median_stddev:
                item["quadrant"] = "Low Spend, Low Volatility"
            else:
                item["quadrant"] = "Low Spend, High Volatility"
        
        return {
            "success": True,
            "chart_type": "scatter",
            "data": volatility_data,
            "config": {
                "xAxis": {
                    "dataKey": "mean",
                    "name": "Average Transaction ($)",
                    "type": "number",
                    "tickFormatter": "currency"
                },
                "yAxis": {
                    "dataKey": "stddev",
                    "name": "Std Deviation ($)",
                    "type": "number",
                    "tickFormatter": "currency"
                },
                "referenceLines": [
                    {"x": median_mean, "stroke": "#94a3b8", "strokeDasharray": "3 3"},
                    {"y": median_stddev, "stroke": "#94a3b8", "strokeDasharray": "3 3"}
                ]
            },
            "metadata": {
                "title": "Category Spending Volatility",
                "description": "Which categories have unpredictable spending patterns?",
                "insights": [
                    f"Most volatile: {max(volatility_data, key=lambda x: x['stddev'])['category']}",
                    f"Most predictable: {min(volatility_data, key=lambda x: x['coefficient_of_variation'])['category']}",
                    f"Categories analyzed: {len(volatility_data)}"
                ]
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": f"Failed to generate volatility scatter: {str(e)}"
        }


async def generate_budget_breach_curve(user_id: str) -> dict:
    """
    Generate time-to-breach curve showing when each budget will be exceeded.
    
    Projects days until each category budget is breached based on current pace.
    
    Args:
        user_id: User ID
    
    Returns:
        Multi-line chart showing breach timeline per category
    """
    try:
        supabase = get_supabase_client()
        
        # Get active budgets
        budgets = supabase.table("budgets").select(
            "category, cap_amount, period"
        ).eq("user_id", user_id).eq("is_active", True).execute()
        
        if not budgets.data:
            return {
                "success": False,
                "error": "No active budgets",
                "summary": "Set up budgets to see breach projections."
            }
        
        # Get current month spending by category
        month_start = datetime.now().replace(day=1).strftime("%Y-%m-%d")
        
        transactions = supabase.table("transactions").select(
            "category, amount, posted_at"
        ).eq("user_id", user_id).gte("posted_at", month_start).execute()
        
        if not transactions.data:
            return {
                "success": False,
                "error": "No transaction data",
                "summary": "No transactions this month to project budget breach."
            }
        
        df = pd.DataFrame(transactions.data)
        df['amount'] = df['amount'].abs()
        df['posted_at'] = pd.to_datetime(df['posted_at'])
        
        # Calculate spending rate per category
        current_day = datetime.now().day
        breach_data = {}
        
        for budget in budgets.data:
            category = budget["category"]
            cap = budget["cap_amount"]
            
            category_df = df[df['category'] == category]
            if len(category_df) == 0:
                continue
            
            total_spent = category_df['amount'].sum()
            daily_rate = total_spent / current_day
            
            # Calculate days until breach
            remaining = cap - total_spent
            days_to_breach = (remaining / daily_rate) if daily_rate > 0 else 999
            breach_day = current_day + days_to_breach
            
            breach_data[category] = {
                "current_spending": total_spent,
                "daily_rate": daily_rate,
                "days_to_breach": min(breach_day, 31),  # Cap at month end
                "will_breach": breach_day <= 31
            }
        
        # Generate timeline data
        timeline_data = []
        for day in range(1, 32):
            day_data = {"day": day}
            
            for category, data in breach_data.items():
                if day <= current_day:
                    # Historical data
                    day_data[category] = round((day / current_day) * data["current_spending"], 2)
                else:
                    # Projected data
                    projected = data["current_spending"] + (data["daily_rate"] * (day - current_day))
                    day_data[category] = round(projected, 2) if projected > 0 else None
            
            timeline_data.append(day_data)
        
        # Generate line configs for each category
        lines = []
        for category in breach_data.keys():
            lines.append({
                "dataKey": category,
                "name": category,
                "stroke": _get_category_color(category),
                "strokeWidth": 2
            })
        
        breach_warnings = [
            f"{cat}: Day {data['days_to_breach']:.0f}"
            for cat, data in breach_data.items()
            if data["will_breach"]
        ]
        
        return {
            "success": True,
            "chart_type": "line",
            "data": timeline_data,
            "config": {
                "xAxis": {"dataKey": "day", "label": "Day of Month"},
                "yAxis": {"label": "Cumulative Spending ($)", "tickFormatter": "currency"},
                "lines": lines
            },
            "metadata": {
                "title": "Budget Breach Timeline",
                "description": "Projected day when each budget will be exceeded",
                "insights": [
                    f"Categories at risk: {len(breach_warnings)}",
                    f"Breach timeline: {', '.join(breach_warnings)}" if breach_warnings else "All budgets safe"
                ]
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": f"Failed to generate breach curve: {str(e)}"
        }

