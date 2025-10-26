"""Financial Summary Generator

Generates comprehensive financial summaries by aggregating data from:
- Transaction history
- Budget status and progress
- Cashflow analysis
- Spending patterns and trends
- Alerts and recommendations

Focus: Educational, judgment-free insights with actionable recommendations.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from .config import get_supabase_client


def _format_currency(amount: float) -> str:
    """Format amount as currency string."""
    return f"${abs(amount):,.2f}"


async def generate_financial_summary(user_id: str, period_days: int = 30) -> Dict[str, Any]:
    """
    Generate a comprehensive financial summary.
    
    This is the master function that aggregates ALL available financial data
    from agents and database to create an educational, metrics-driven summary.
    
    Args:
        user_id: User UUID
        period_days: Number of days to analyze (default 30)
    
    Returns:
        Dictionary with comprehensive summary data ready for storage/display
    """
    try:
        supabase = get_supabase_client()
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=period_days)
        
        # ============================================================
        # STEP 1: FETCH ALL DATA SOURCES
        # ============================================================
        
        # 1.1 Transactions
        transactions_response = supabase.table("transactions").select(
            "amount, posted_at, merchant_name, category, subcategory"
        ).eq("user_id", user_id).gte(
            "posted_at", start_date.strftime("%Y-%m-%d")
        ).order("posted_at", desc=True).execute()
        
        transactions = transactions_response.data if transactions_response.data else []
        
        # 1.2 Budgets
        budgets_response = supabase.table("budgets").select(
            "id, category, cap_amount, period, is_active, start_on"
        ).eq("user_id", user_id).eq("is_active", True).execute()
        
        budgets = budgets_response.data if budgets_response.data else []
        
        # 1.3 Account balances
        accounts_response = supabase.table("accounts").select("id").eq("user_id", user_id).execute()
        account_ids = [acc["id"] for acc in accounts_response.data] if accounts_response.data else []
        
        balances = []
        for account_id in account_ids:
            balance_response = supabase.table("account_balances").select(
                "current, available, as_of"
            ).eq("account_id", account_id).order("as_of", desc=True).limit(1).execute()
            if balance_response.data:
                balances.extend(balance_response.data)
        
        # 1.4 Alerts (excluding fraud - per requirements)
        alerts_response = supabase.table("alerts").select(
            "type, severity, reason, score, created_at"
        ).eq("user_id", user_id).in_(
            "severity", ["critical", "warn"]
        ).gte("created_at", start_date.isoformat()).execute()
        
        alerts = alerts_response.data if alerts_response.data else []
        
        # 1.5 Insights (AI-generated)
        insights_response = supabase.table("insights").select(
            "title, body, severity, created_at"
        ).eq("user_id", user_id).gte(
            "created_at", start_date.isoformat()
        ).order("created_at", desc=True).limit(10).execute()
        
        insights = insights_response.data if insights_response.data else []
        
        # ============================================================
        # STEP 2: CALCULATE CORE METRICS
        # ============================================================
        
        # 2.1 Income vs Expenses
        income = sum(float(tx["amount"]) for tx in transactions if float(tx["amount"]) > 0)
        expenses = abs(sum(float(tx["amount"]) for tx in transactions if float(tx["amount"]) < 0))
        net_flow = income - expenses
        
        # 2.2 Category breakdown
        category_spending = {}
        category_count = {}
        for tx in transactions:
            if float(tx["amount"]) < 0:
                cat = tx.get("category", "other")
                amount = abs(float(tx["amount"]))
                category_spending[cat] = category_spending.get(cat, 0) + amount
                category_count[cat] = category_count.get(cat, 0) + 1
        
        top_categories = sorted(
            [{"category": k, "amount": v, "count": category_count[k], "percentage": (v / expenses * 100) if expenses > 0 else 0}
             for k, v in category_spending.items()],
            key=lambda x: x["amount"],
            reverse=True
        )[:5]
        
        # 2.3 Spending trends (first half vs second half)
        mid_point = len(transactions) // 2
        first_half = transactions[:mid_point]
        second_half = transactions[mid_point:]
        
        first_half_spend = abs(sum(float(tx["amount"]) for tx in first_half if float(tx["amount"]) < 0))
        second_half_spend = abs(sum(float(tx["amount"]) for tx in second_half if float(tx["amount"]) < 0))
        
        trend_direction = "increasing" if second_half_spend > first_half_spend else "decreasing"
        trend_percentage = abs((second_half_spend - first_half_spend) / first_half_spend * 100) if first_half_spend > 0 else 0
        
        # 2.4 Budget progress (calculate actual usage)
        budget_status = []
        for budget in budgets:
            category = budget["category"]
            cap = budget["cap_amount"]
            
            # Calculate spending in this category
            category_spent = category_spending.get(category, 0)
            percentage_used = (category_spent / cap * 100) if cap > 0 else 0
            
            budget_status.append({
                "category": category,
                "cap": cap,
                "spent": category_spent,
                "remaining": cap - category_spent,
                "percentage": percentage_used,
                "status": "on_track" if percentage_used < 80 else "warning" if percentage_used < 100 else "breached"
            })
        
        budgets_on_track = sum(1 for b in budget_status if b["status"] == "on_track")
        budgets_warning = sum(1 for b in budget_status if b["status"] == "warning")
        budgets_breached = sum(1 for b in budget_status if b["status"] == "breached")
        
        # 2.5 Balance and cashflow
        current_balance = balances[0]["current"] if balances else 0
        available_balance = balances[0]["available"] if balances else 0
        
        # Simple runway calculation (days until zero based on current spending rate)
        avg_daily_spend = expenses / period_days if period_days > 0 else 0
        runway_days = int(current_balance / avg_daily_spend) if avg_daily_spend > 0 else 999
        
        # ============================================================
        # STEP 3: IDENTIFY RISKS (non-fraud, educational focus)
        # ============================================================
        
        risks = []
        
        # Risk 1: Low runway
        if runway_days < 30 and current_balance > 0:
            risks.append({
                "type": "low_cashflow",
                "severity": "critical" if runway_days < 14 else "warn",
                "title": "Low Cash Reserve",
                "description": f"At current spending rate, funds may deplete in ~{runway_days} days",
                "why": f"Daily spending average is ${avg_daily_spend:.2f}, current balance is ${current_balance:,.2f}",
                "estimated_impact": f"Could affect ability to cover ${_format_currency(expenses)} in expenses",
                "context": "Based on current balance and average daily spending rate"
            })
        
        # Risk 2: Budget breaches
        if budgets_breached > 0:
            breached_budgets = [b for b in budget_status if b["status"] == "breached"]
            total_over = sum(b["spent"] - b["cap"] for b in breached_budgets)
            risks.append({
                "type": "budget_breach",
                "severity": "warn",
                "title": f"{budgets_breached} Budget{'s' if budgets_breached > 1 else ''} Exceeded",
                "description": f"Over budget by ${total_over:,.2f} across {budgets_breached} categories",
                "why": "Actual spending exceeded planned budget limits",
                "estimated_impact": f"${total_over:,.2f} over budget could impact other financial goals",
                "context": f"Categories: {', '.join(b['category'] for b in breached_budgets)}"
            })
        
        # Risk 3: Alerts
        critical_alerts = [a for a in alerts if a.get("severity") == "critical"]
        if critical_alerts:
            unique_alert_types = list(set(a["type"] for a in critical_alerts))
            risks.append({
                "type": "alerts",
                "severity": "critical",
                "title": f"{len(critical_alerts)} Critical Alert{'s' if len(critical_alerts) > 1 else ''}",
                "description": f"Issues detected in: {', '.join(unique_alert_types)}",
                "why": "System detected unusual patterns or issues requiring attention",
                "estimated_impact": "Immediate attention recommended",
                "context": "See alerts section for details"
            })
        
        # ============================================================
        # STEP 4: GENERATE NEXT BEST ACTIONS
        # ============================================================
        
        next_actions = []
        
        # Action 1: Critical alerts
        if critical_alerts:
            next_actions.append({
                "action": "Review and address critical alerts",
                "priority": "high",
                "why": f"You have {len(critical_alerts)} critical items requiring attention",
                "estimated_impact": "Immediate risk mitigation",
                "choices": ["View alerts", "Set up automation", "Adjust settings"],
                "how": "Visit the Alerts section to see details and take action"
            })
        
        # Action 2: Budget optimization
        if budgets_warning > 0:
            warning_budgets = [b for b in budget_status if b["status"] == "warning"]
            potential_savings = sum(max(0, b["spent"] - b["cap"] * 0.8) for b in warning_budgets)
            
            next_actions.append({
                "action": f"Optimize {budgets_warning} budget{'s' if budgets_warning > 1 else ''} near limit",
                "priority": "medium",
                "why": f"{budgets_warning} categories approaching budget limits",
                "estimated_impact": f"Potential savings: ${potential_savings:,.2f}/month by staying within budget",
                "choices": ["Adjust budget amounts", "Review spending in categories", "Set up alerts"],
                "how": "Go to Budgets to review and adjust limits before they're exceeded"
            })
        
        # Action 3: Subscription optimization
        entertainment_spend = category_spending.get("entertainment", 0)
        if entertainment_spend > 100:
            next_actions.append({
                "action": "Review recurring subscriptions",
                "priority": "low",
                "why": f"Entertainment category spending is ${entertainment_spend:,.2f}",
                "estimated_impact": f"Potential to save ${entertainment_spend * 0.15:,.2f}/month by canceling unused services",
                "choices": ["View subscriptions analysis", "Cancel unused services", "Downgrade plans"],
                "how": "Check your subscriptions and identify any you no longer use"
            })
        
        # Action 4: Savings opportunity
        if net_flow > 0 and runway_days < 60:
            next_actions.append({
                "action": "Build emergency fund",
                "priority": "medium",
                "why": f"Positive cashflow of ${net_flow:,.2f} but low runway of {runway_days} days",
                "estimated_impact": f"Building ${net_flow * 3:,.2f} fund would provide 3 months of buffer",
                "choices": ["Set savings goal", "Automate transfers", "Adjust spending"],
                "how": "Aim to save 3-6 months of expenses as an emergency fund"
            })
        
        # ============================================================
        # STEP 5: GENERATE MICRO LESSON
        # ============================================================
        
        # Choose lesson based on most relevant pattern
        if trend_direction == "increasing" and second_half_spend > first_half_spend * 1.2:
            micro_lesson = {
                "title": "Understanding Spending Velocity",
                "content": f"Your spending has increased by {trend_percentage:.1f}% in the second half of the period. This 'spending velocity' pattern—spending more later in the month—can stress your budget if not managed. Consider spreading larger purchases throughout the period or setting mid-month budget checkpoints.",
                "why": f"Analysis shows spending trend: ${_format_currency(first_half_spend)} early vs ${_format_currency(second_half_spend)} later",
                "takeaway": "Consistent spending over time is healthier than front-loaded or back-loaded spending patterns"
            }
        elif avg_daily_spend > 0 and runway_days < 60:
            micro_lesson = {
                "title": "Cash Flow Runway Explained",
                "content": f"Your 'runway' is {runway_days} days—the time until funds deplete at current spending rates. A healthy runway is 3-6 months (90-180 days). To improve: reduce daily spending by ${avg_daily_spend * 0.1:.2f} or increase income. This buffer protects against unexpected expenses.",
                "why": f"Current balance: ${current_balance:,.2f}, Daily average: ${avg_daily_spend:.2f}",
                "takeaway": "Maintaining a 3-6 month runway provides financial security and reduces stress"
            }
        elif budgets_breached > 0:
            micro_lesson = {
                "title": "Budget Breach Recovery",
                "content": f"You've exceeded {budgets_breached} budget(s). This happens, and it's a learning opportunity. Review these categories to understand what drove the overage—was it unexpected expenses or underestimated costs? Adjust future budgets based on actual needs, not aspirations.",
                "why": f"Budget analysis shows {budgets_breached} category/ies over limit",
                "takeaway": "Budgets should reflect realistic spending, not ideal spending"
            }
        else:
            micro_lesson = {
                "title": "Understanding Net Cash Flow",
                "content": f"Your net cash flow is ${net_flow:,.2f}—the difference between income and expenses. Positive flow (${income:,.2f} in vs ${expenses:,.2f} out) means you're building wealth. This surplus can be used for savings, investments, or paying down debt faster.",
                "why": f"Income: ${income:,.2f}, Expenses: ${expenses:,.2f}, Net: ${net_flow:,.2f}",
                "takeaway": "Positive cash flow is the foundation of financial health"
            }
        
        # ============================================================
        # STEP 6: IDENTIFY WINS (celebrate progress)
        # ============================================================
        
        wins = []
        
        if budgets_on_track > 0:
            wins.append({
                "achievement": f"{budgets_on_track} budget{'s' if budgets_on_track > 1 else ''} on track",
                "impact": "Managing most spending categories within limits",
                "celebration": "Great discipline in tracking and staying within budget!"
            })
        
        if trend_direction == "decreasing":
            wins.append({
                "achievement": "Spending trend improving",
                "impact": f"Reduced spending by {trend_percentage:.1f}% compared to earlier in the period",
                "celebration": "Your efforts to control spending are working!"
            })
        
        if net_flow > 0:
            wins.append({
                "achievement": "Positive cash flow",
                "impact": f"Saved ${net_flow:,.2f} this period",
                "celebration": "You're living within your means and building savings!"
            })
        
        if not critical_alerts:
            wins.append({
                "achievement": "No critical issues",
                "impact": "All systems green, finances look healthy",
                "celebration": "Keep up the great work!"
            })
        
        # ============================================================
        # STEP 7: ASSEMBLE COMPLETE SUMMARY
        # ============================================================
        
        summary = {
            "period": {
                "days": period_days,
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
                "generated_at": datetime.now().isoformat()
            },
            "financial_overview": {
                "total_income": round(income, 2),
                "total_expenses": round(expenses, 2),
                "net_flow": round(net_flow, 2),
                "avg_daily_income": round(income / period_days, 2) if period_days > 0 else 0,
                "avg_daily_expenses": round(expenses / period_days, 2) if period_days > 0 else 0
            },
            "spending_breakdown": {
                "top_categories": top_categories,
                "total_categories": len(category_spending),
                "category_diversity": "high" if len(category_spending) >= 6 else "medium" if len(category_spending) >= 3 else "low"
            },
            "spending_trends": {
                "direction": trend_direction,
                "change_percentage": round(trend_percentage, 1),
                "first_half_spending": round(first_half_spend, 2),
                "second_half_spending": round(second_half_spend, 2),
                "interpretation": f"Spending {'increased' if trend_direction == 'increasing' else 'decreased'} by {trend_percentage:.1f}%"
            },
            "budget_progress": {
                "total_budgets": len(budgets),
                "on_track": budgets_on_track,
                "warning": budgets_warning,
                "breached": budgets_breached,
                "detailed_status": budget_status,
                "health_score": "good" if budgets_breached == 0 and budgets_warning < 2 else "needs_attention" if budgets_breached < 2 else "critical"
            },
            "balance": {
                "current": round(current_balance, 2),
                "available": round(available_balance, 2),
                "runway_days": runway_days,
                "health": "excellent" if runway_days > 180 else "good" if runway_days > 90 else "fair" if runway_days > 30 else "low"
            },
            "risks": risks,
            "next_best_actions": next_actions,
            "micro_lesson": micro_lesson,
            "wins": wins,
            "insights_count": len(insights),
            "metrics": {
                "savings_rate": round((net_flow / income * 100) if income > 0 else 0, 1),
                "expense_ratio": round((expenses / income * 100) if income > 0 else 0, 1),
                "days_until_breach": min([b["remaining"] / (b["spent"] / period_days) for b in budget_status if b["spent"] > 0 and b["remaining"] > 0], default=999)
            }
        }
        
        return {
            "success": True,
            "summary": summary,
            "metadata": {
                "transactions_analyzed": len(transactions),
                "budgets_analyzed": len(budgets),
                "generation_time": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": None
        }
