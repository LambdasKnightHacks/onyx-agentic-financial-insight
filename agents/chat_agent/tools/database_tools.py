""" Database query tools for the chat agent """

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from chat_agent.config import get_supabase_client


# ============================================================================
# CATEGORY VALIDATION (matches categorization agent taxonomy)
# ============================================================================

VALID_CATEGORIES = {
    "income", "living", "food", "transportation", "shopping",
    "entertainment", "travel", "healthcare", "education", "financial"
}

VALID_SUBCATEGORIES = {
    "income": ["salary", "freelance", "business_revenue", "investment_income", "transfers"],
    "living": ["rent", "mortgage", "electricity", "water", "gas", "internet"],
    "food": ["dining", "groceries", "coffee_tea", "bars"],
    "transportation": ["gas", "public_transit", "car_maintenance", "parking", "tolls"],
    "shopping": ["clothing", "electronics", "household", "online"],
    "entertainment": ["movies", "games", "music", "sports", "streaming", "events", "subscriptions"],
    "travel": ["flights", "hotels"],
    "healthcare": ["doctor", "prescriptions", "insurance"],
    "education": ["tuition", "books", "courses"],
    "financial": ["loan", "credit_card_payments", "bank_fees", "taxes", "investment_purchases"]
}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _format_currency(amount: float) -> str:
    """Helper function to format currency."""
    return f"${abs(amount):,.2f}"


# ============================================================================
# BASIC READ TOOLS
# ============================================================================

async def get_recent_alerts(
    user_id: str, 
    limit: Optional[int], 
    alert_type: Optional[str],
    resolved: Optional[bool]
) -> dict:
    """
    Fetch recent alerts for a user.
    
    Args:
        user_id: User ID to fetch alerts for
        limit: Maximum number of alerts to return (defaults to 10 if not provided)
        alert_type: Optional filter by alert type (fraud, budget, cashflow)
        resolved: Optional filter by resolved status (True/False/None for all)
    
    Returns:
        dict with success, data, and summary fields
    """
    try:
        # Handle defaults inside function
        if limit is None:
            limit = 10
        
        supabase = get_supabase_client()
        
        # Build query
        query = supabase.table("alerts").select(
            "id, type, score, reason, severity, created_at, resolved, status, tx_id"
        ).eq("user_id", user_id).order("created_at", desc=True).limit(limit)
        
        # Apply filters
        if alert_type:
            query = query.eq("type", alert_type)
        if resolved is not None:
            query = query.eq("resolved", resolved)
        
        response = query.execute()
        
        if not response.data:
            return {
                "success": True,
                "data": [],
                "summary": "No alerts found for this user."
            }
        
        # Generate summary
        alerts = response.data
        critical_count = sum(1 for a in alerts if a.get("severity") == "critical")
        warn_count = sum(1 for a in alerts if a.get("severity") == "warn")
        unresolved_count = sum(1 for a in alerts if not a.get("resolved"))
        
        summary = f"Found {len(alerts)} alert(s)"
        if critical_count > 0:
            summary += f" ({critical_count} critical"
            if warn_count > 0:
                summary += f", {warn_count} warnings"
            summary += ")"
        elif warn_count > 0:
            summary += f" ({warn_count} warnings)"
        
        if unresolved_count > 0:
            summary += f". {unresolved_count} unresolved."
        
        return {
            "success": True,
            "data": alerts,
            "summary": summary,
            "metadata": {
                "total": len(alerts),
                "critical": critical_count,
                "warnings": warn_count,
                "unresolved": unresolved_count
            }
        }
    except Exception as e:
        return {
            "success": False,
            "data": [],
            "error": str(e),
            "summary": f"Failed to fetch alerts: {str(e)}"
        }


async def get_recent_insights(user_id: str, limit: Optional[int]) -> dict:
    """
    Fetch recent AI-generated insights for a user.
    
    Args:
        user_id: User ID to fetch insights for
        limit: Maximum number of insights to return (defaults to 10 if not provided)
    
    Returns:
        dict with success, data, and summary fields
    """
    try:
        # Handle defaults inside function
        if limit is None:
            limit = 10
        
        supabase = get_supabase_client()
        
        response = supabase.table("insights").select(
            "id, title, body, severity, created_at, data, risk_assessment, recommendations"
        ).eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        
        if not response.data:
            return {
                "success": True,
                "data": [],
                "summary": "No insights available yet. Process some transactions to generate insights."
            }
        
        insights = response.data
        
        # Generate summary
        critical_count = sum(1 for i in insights if i.get("severity") == "critical")
        summary = f"Found {len(insights)} insight(s)"
        if critical_count > 0:
            summary += f" ({critical_count} require attention)"
        
        return {
            "success": True,
            "data": insights,
            "summary": summary,
            "metadata": {
                "total": len(insights),
                "critical": critical_count
            }
        }
    except Exception as e:
        return {
            "success": False,
            "data": [],
            "error": str(e),
            "summary": f"Failed to fetch insights: {str(e)}"
        }


async def get_recent_transactions(
    user_id: str, 
    days: Optional[int], 
    limit: Optional[int],
    category: Optional[str]
) -> dict:
    """
    Fetch recent transactions for a user.
    
    Args:
        user_id: User ID to fetch transactions for
        days: Number of days to look back (defaults to 30 if not provided)
        limit: Maximum number of transactions to return (defaults to 50 if not provided)
        category: Optional filter by category
    
    Returns:
        dict with success, data, and summary fields
    """
    try:
        # Handle defaults inside function
        if days is None:
            days = 30
        if limit is None:
            limit = 50
        
        supabase = get_supabase_client()
        
        # Calculate date threshold
        date_threshold = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        # Build query
        query = supabase.table("transactions").select(
            "id, amount, merchant_name, description, category, subcategory, "
            "posted_at, pending, payment_channel, location_city, location_state, "
            "fraud_score, category_confidence"
        ).eq("user_id", user_id).gte("posted_at", date_threshold).order(
            "posted_at", desc=True
        ).limit(limit)
        
        # Apply category filter
        if category:
            query = query.eq("category", category)
        
        response = query.execute()
        
        if not response.data:
            return {
                "success": True,
                "data": [],
                "summary": f"No transactions found in the last {days} days."
            }
        
        transactions = response.data
        
        # Calculate statistics
        total_amount = sum(abs(t.get("amount", 0)) for t in transactions)
        avg_amount = total_amount / len(transactions) if transactions else 0
        
        summary = f"Found {len(transactions)} transaction(s) in the last {days} days. "
        summary += f"Total: ${total_amount:,.2f}, Average: ${avg_amount:,.2f}"
        
        return {
            "success": True,
            "data": transactions,
            "summary": summary,
            "metadata": {
                "total_transactions": len(transactions),
                "total_amount": round(total_amount, 2),
                "average_amount": round(avg_amount, 2),
                "days": days
            }
        }
    except Exception as e:
        return {
            "success": False,
            "data": [],
            "error": str(e),
            "summary": f"Failed to fetch transactions: {str(e)}"
        }


async def get_account_balances(user_id: str) -> dict:
    """
    Fetch current account balances for a user.
    
    Args:
        user_id: User ID to fetch balances for
    
    Returns:
        dict with success, data, and summary fields
    """
    try:
        supabase = get_supabase_client()
        
        # Get accounts
        accounts_response = supabase.table("accounts").select(
            "id, name, type, currency, display_mask, institution"
        ).eq("user_id", user_id).execute()
        
        if not accounts_response.data:
            return {
                "success": True,
                "data": [],
                "summary": "No accounts found. Link a bank account to see balances."
            }
        
        accounts = accounts_response.data
        accounts_with_balances = []
        total_balance = 0
        
        # Get latest balance for each account
        for account in accounts:
            balance_response = supabase.table("account_balances").select(
                "current, available, as_of, currency"
            ).eq("account_id", account["id"]).order("as_of", desc=True).limit(1).execute()
            
            if balance_response.data:
                balance_data = balance_response.data[0]
                account["balance"] = balance_data.get("current", 0)
                account["available"] = balance_data.get("available", 0)
                account["as_of"] = balance_data.get("as_of")
                total_balance += balance_data.get("current", 0)
            else:
                account["balance"] = None
                account["available"] = None
                account["as_of"] = None
            
            accounts_with_balances.append(account)
        
        summary = f"Found {len(accounts)} account(s). Total balance: ${total_balance:,.2f}"
        
        return {
            "success": True,
            "data": accounts_with_balances,
            "summary": summary,
            "metadata": {
                "total_accounts": len(accounts),
                "total_balance": round(total_balance, 2)
            }
        }
    except Exception as e:
        return {
            "success": False,
            "data": [],
            "error": str(e),
            "summary": f"Failed to fetch account balances: {str(e)}"
        }

# AGGREGATION TOOLS

async def get_spending_by_category(user_id: str, days: Optional[int]) -> dict:
    """
    Aggregate spending by category for a user.
    
    Args:
        user_id: User ID to analyze
        days: Number of days to look back (defaults to 30 if not provided)
    
    Returns:
        dict with success, data (category aggregations), and summary
    """
    try:
        # Handle defaults inside function
        if days is None:
            days = 30
        
        supabase = get_supabase_client()
        
        # Calculate date threshold
        date_threshold = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        # Get transactions
        response = supabase.table("transactions").select(
            "category, subcategory, amount"
        ).eq("user_id", user_id).gte("posted_at", date_threshold).execute()
        
        if not response.data:
            return {
                "success": True,
                "data": [],
                "summary": f"No transactions found in the last {days} days."
            }
        
        # Aggregate by category
        category_totals = {}
        for tx in response.data:
            category = tx.get("category") or "Uncategorized"
            amount = abs(tx.get("amount", 0))
            
            if category not in category_totals:
                category_totals[category] = {
                    "category": category,
                    "total_amount": 0,
                    "transaction_count": 0
                }
            
            category_totals[category]["total_amount"] += amount
            category_totals[category]["transaction_count"] += 1
        
        # Convert to list and sort by amount
        category_list = list(category_totals.values())
        category_list.sort(key=lambda x: x["total_amount"], reverse=True)
        
        # Round amounts
        for cat in category_list:
            cat["total_amount"] = round(cat["total_amount"], 2)
        
        # Generate summary
        total_spending = sum(c["total_amount"] for c in category_list)
        top_category = category_list[0] if category_list else None
        
        summary = f"Total spending: ${total_spending:,.2f} across {len(category_list)} categories"
        if top_category:
            summary += f". Top category: {top_category['category']} (${top_category['total_amount']:,.2f})"
        
        return {
            "success": True,
            "data": category_list,
            "summary": summary,
            "metadata": {
                "total_spending": round(total_spending, 2),
                "category_count": len(category_list),
                "days": days
            }
        }
    except Exception as e:
        return {
            "success": False,
            "data": [],
            "error": str(e),
            "summary": f"Failed to calculate spending by category: {str(e)}"
        }


async def get_budget_status(user_id: str) -> dict:
    """
    Get budget status (actual vs budget) for all user budgets.
    
    Args:
        user_id: User ID to check budgets for
    
    Returns:
        dict with success, data (budget status), and summary
    """
    try:
        supabase = get_supabase_client()
        
        # Get active budgets
        budgets_response = supabase.table("budgets").select(
            "id, category, subcategory, label, period, cap_amount, start_on"
        ).eq("user_id", user_id).eq("is_active", True).execute()
        
        if not budgets_response.data:
            return {
                "success": True,
                "data": [],
                "summary": "No active budgets set. Create a budget to start tracking."
            }
        
        budgets = budgets_response.data
        budget_status_list = []
        over_budget_count = 0
        
        for budget in budgets:
            category = budget["category"]
            period = budget["period"]
            cap_amount = budget["cap_amount"]
            
            # Calculate date range based on period
            if period == "month":
                start_date = datetime.now().replace(day=1).strftime("%Y-%m-%d")
            elif period == "week":
                start_date = (datetime.now() - timedelta(days=datetime.now().weekday())).strftime("%Y-%m-%d")
            else:
                start_date = budget.get("start_on", datetime.now().strftime("%Y-%m-%d"))
            
            # Get spending for this category
            query = supabase.table("transactions").select("amount").eq(
                "user_id", user_id
            ).eq("category", category).gte("posted_at", start_date)
            
            if budget.get("subcategory"):
                query = query.eq("subcategory", budget["subcategory"])
            
            transactions = query.execute()
            
            # Calculate total spending
            actual_spending = sum(abs(t.get("amount", 0)) for t in transactions.data)
            percentage = (actual_spending / cap_amount * 100) if cap_amount > 0 else 0
            remaining = cap_amount - actual_spending
            over_budget = actual_spending > cap_amount
            
            if over_budget:
                over_budget_count += 1
            
            budget_status_list.append({
                "budget_id": budget["id"],
                "category": category,
                "subcategory": budget.get("subcategory"),
                "label": budget.get("label"),
                "period": period,
                "budget_amount": round(cap_amount, 2),
                "actual_spending": round(actual_spending, 2),
                "remaining": round(remaining, 2),
                "percentage_used": round(percentage, 1),
                "over_budget": over_budget,
                "status": "over" if over_budget else ("warning" if percentage >= 80 else "good")
            })
        
        # Sort by percentage used (descending)
        budget_status_list.sort(key=lambda x: x["percentage_used"], reverse=True)
        
        # Generate summary
        summary = f"You have {len(budgets)} active budget(s)"
        if over_budget_count > 0:
            summary += f". ⚠️ {over_budget_count} budget(s) exceeded!"
        else:
            warning_count = sum(1 for b in budget_status_list if b["status"] == "warning")
            if warning_count > 0:
                summary += f". {warning_count} budget(s) at 80%+ capacity."
            else:
                summary += ". All budgets are on track! 🎉"
        
        return {
            "success": True,
            "data": budget_status_list,
            "summary": summary,
            "metadata": {
                "total_budgets": len(budgets),
                "over_budget_count": over_budget_count
            }
        }
    except Exception as e:
        return {
            "success": False,
            "data": [],
            "error": str(e),
            "summary": f"Failed to fetch budget status: {str(e)}"
        }


async def get_cashflow_summary(user_id: str) -> dict:
    """
    Get cashflow summary including runway days and forecasts.
    
    Args:
        user_id: User ID to get cashflow summary for
    
    Returns:
        dict with success, data (cashflow metrics), and summary
    """
    try:
        supabase = get_supabase_client()
        
        # Get latest cashflow result
        cashflow_response = supabase.table("cashflow_results").select(
            "runway_days, severity, recommendations, forecast, low_balance_alert, created_at"
        ).eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
        
        if not cashflow_response.data:
            return {
                "success": True,
                "data": {},
                "summary": "No cashflow analysis available yet. Process a transaction to generate cashflow insights."
            }
        
        cashflow_data = cashflow_response.data[0]
        runway_days = cashflow_data.get("runway_days")
        severity = cashflow_data.get("severity", "info")
        low_balance_alert = cashflow_data.get("low_balance_alert", False)
        
        # Generate summary
        if runway_days:
            if runway_days < 30:
                summary = f"⚠️ Your funds may run out in {runway_days} days. Consider reducing expenses."
            elif runway_days < 60:
                summary = f"Your current runway is {runway_days} days. Monitor your spending closely."
            else:
                summary = f"✅ You have {runway_days} days of runway. Financial health looks good!"
        else:
            summary = "Positive cashflow detected. Your income exceeds expenses."
        
        if low_balance_alert:
            summary += " Low balance warning active."
        
        return {
            "success": True,
            "data": cashflow_data,
            "summary": summary,
            "metadata": {
                "severity": severity,
                "low_balance_alert": low_balance_alert
            }
        }
    except Exception as e:
        return {
            "success": False,
            "data": {},
            "error": str(e),
            "summary": f"Failed to fetch cashflow summary: {str(e)}"
        }

# WRITE TOOLS

async def update_budget(
    user_id: str, 
    category: str, 
    new_cap_amount: float,
    subcategory: Optional[str]
) -> dict:
    """
    Update an existing budget cap amount.
    
    IMPORTANT: This tool should only be called after user confirms the change.
    
    Args:
        user_id: User ID
        category: Budget category (must be one of: income, living, food, transportation, 
                 shopping, entertainment, travel, healthcare, education, financial)
        new_cap_amount: New budget cap amount
        subcategory: Optional subcategory for more specific budget (can be omitted)
    
    Returns:
        dict with success status and message
    """
    try:
        if new_cap_amount <= 0:
            return {
                "success": False,
                "error": "Budget amount must be positive",
                "summary": "Budget amount must be greater than zero."
            }
        
        # Validate category
        category_lower = category.lower()
        if category_lower not in VALID_CATEGORIES:
            return {
                "success": False,
                "error": "Invalid category",
                "summary": f"Category '{category}' is not valid. Must be one of: {', '.join(sorted(VALID_CATEGORIES))}"
            }
        
        # Validate subcategory if provided
        if subcategory:
            subcategory_lower = subcategory.lower()
            valid_subs = VALID_SUBCATEGORIES.get(category_lower, [])
            if subcategory_lower not in valid_subs:
                return {
                    "success": False,
                    "error": "Invalid subcategory",
                    "summary": f"Subcategory '{subcategory}' is not valid for '{category}'. Valid options: {', '.join(valid_subs)}"
                }
        
        supabase = get_supabase_client()
        
        # Find existing budget
        query = supabase.table("budgets").select("id, category, cap_amount").eq(
            "user_id", user_id
        ).eq("category", category_lower).eq("is_active", True)
        
        if subcategory:
            query = query.eq("subcategory", subcategory.lower())
        
        existing = query.execute()
        
        if not existing.data:
            subcategory_note = f" (subcategory: {subcategory})" if subcategory else ""
            return {
                "success": False,
                "error": "Budget not found",
                "summary": f"No active budget found for category '{category}'{subcategory_note}. Use create_budget to create one."
            }
        
        budget_id = existing.data[0]["id"]
        old_amount = existing.data[0]["cap_amount"]
        
        # Update budget
        supabase.table("budgets").update({
            "cap_amount": new_cap_amount,
            "updated_at": datetime.now().isoformat()
        }).eq("id", budget_id).execute()
        
        change = new_cap_amount - old_amount
        change_text = f"increased by {_format_currency(change)}" if change > 0 else f"decreased by {_format_currency(abs(change))}"
        
        summary = f"✅ Updated {category} budget from {_format_currency(old_amount)} to {_format_currency(new_cap_amount)} ({change_text})"
        
        return {
            "success": True,
            "data": {
                "budget_id": budget_id,
                "category": category_lower,
                "old_amount": round(old_amount, 2),
                "new_amount": round(new_cap_amount, 2),
                "change": round(change, 2)
            },
            "summary": summary
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": f"Failed to update budget: {str(e)}"
        }


async def create_budget(
    user_id: str,
    category: str,
    cap_amount: float,
    period: Optional[str],
    subcategory: Optional[str],
    label: Optional[str]
) -> dict:
    """
    Create a new budget for a category.
    
    IMPORTANT: This tool should only be called after user confirms the creation.
    
    Args:
        user_id: User ID
        category: Budget category (must be one of: income, living, food, transportation, 
                 shopping, entertainment, travel, healthcare, education, financial)
        cap_amount: Budget cap amount
        period: Budget period ('month' or 'week', defaults to 'month' if not provided)
        subcategory: Optional subcategory (must match category's valid subcategories)
        label: Optional custom label
    
    Returns:
        dict with success status and message
    """
    try:
        # Handle default values inside function
        if period is None:
            period = "month"
        
        if cap_amount <= 0:
            return {
                "success": False,
                "error": "Budget amount must be positive",
                "summary": "Budget amount must be greater than zero."
            }
        
        if period not in ["month", "week"]:
            return {
                "success": False,
                "error": "Invalid period",
                "summary": "Period must be 'month' or 'week'."
            }
        
        # Validate category
        category_lower = category.lower()
        if category_lower not in VALID_CATEGORIES:
            return {
                "success": False,
                "error": "Invalid category",
                "summary": f"Category '{category}' is not valid. Must be one of: {', '.join(sorted(VALID_CATEGORIES))}"
            }
        
        # Validate subcategory if provided
        if subcategory:
            subcategory_lower = subcategory.lower()
            valid_subs = VALID_SUBCATEGORIES.get(category_lower, [])
            if subcategory_lower not in valid_subs:
                return {
                    "success": False,
                    "error": "Invalid subcategory",
                    "summary": f"Subcategory '{subcategory}' is not valid for '{category}'. Valid options: {', '.join(valid_subs)}"
                }
        
        supabase = get_supabase_client()
        
        # Check if budget already exists
        query = supabase.table("budgets").select("id").eq("user_id", user_id).eq(
            "category", category_lower
        ).eq("is_active", True)
        
        if subcategory:
            query = query.eq("subcategory", subcategory.lower())
        
        existing = query.execute()
        
        if existing.data:
            return {
                "success": False,
                "error": "Budget already exists",
                "summary": f"A budget for '{category}' already exists. Use update_budget to modify it."
            }
        
        # Create new budget
        budget_data = {
            "user_id": user_id,
            "category": category_lower,
            "cap_amount": cap_amount,
            "period": period,
            "is_active": True,
            "priority": 100,
            "rollover": False,
            "currency": "USD"
        }
        
        if subcategory:
            budget_data["subcategory"] = subcategory.lower()
        if label:
            budget_data["label"] = label
        
        result = supabase.table("budgets").insert(budget_data).execute()
        
        summary = f"✅ Created new {period}ly budget for {category}: {_format_currency(cap_amount)}"
        
        return {
            "success": True,
            "data": result.data[0] if result.data else {},
            "summary": summary
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": f"Failed to create budget: {str(e)}"
        }


async def resolve_alert(user_id: str, alert_id: str) -> dict:
    """
    Mark an alert as resolved.
    
    Args:
        user_id: User ID (for security check)
        alert_id: Alert ID to resolve
    
    Returns:
        dict with success status and message
    """
    try:
        supabase = get_supabase_client()
        
        # Verify alert belongs to user
        alert_check = supabase.table("alerts").select("id, type, resolved").eq(
            "id", alert_id
        ).eq("user_id", user_id).execute()
        
        if not alert_check.data:
            return {
                "success": False,
                "error": "Alert not found",
                "summary": "Alert not found or you don't have permission to resolve it."
            }
        
        alert_data = alert_check.data[0]
        
        if alert_data.get("resolved"):
            return {
                "success": True,
                "data": alert_data,
                "summary": "This alert was already resolved."
            }
        
        # Mark as resolved
        supabase.table("alerts").update({
            "resolved": True,
            "status": "resolved"
        }).eq("id", alert_id).execute()
        
        summary = f"✅ Resolved {alert_data.get('type', 'alert')} alert"
        
        return {
            "success": True,
            "data": {
                "alert_id": alert_id,
                "type": alert_data.get("type")
            },
            "summary": summary
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": f"Failed to resolve alert: {str(e)}"
        }
