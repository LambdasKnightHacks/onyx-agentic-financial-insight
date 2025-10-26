"""
Data aggregation tools for financial profile enrichment

Fetches and computes comprehensive user financial data including:
- Transaction history and patterns
- Active budgets
- Account balances
- Income/expense analysis
- Behavioral metrics
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta
from collections import defaultdict
import statistics
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from decision_agent.config import get_supabase_client, DEFAULT_ELASTICITY_SCORES


async def fetch_user_financial_profile(user_id: str, days: int = 90) -> Dict[str, Any]:
    """
    Fetch comprehensive financial profile for a user
    
    Args:
        user_id: User UUID
        days: Number of days of transaction history to analyze
    
    Returns:
        Complete financial profile dictionary
    """
    supabase = get_supabase_client()
    
    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Fetch all data in parallel
    import asyncio
    
    # Get transactions
    transactions_response = supabase.table("transactions").select(
        "id, amount, posted_at, merchant_name, category, subcategory, description"
    ).eq("user_id", user_id).gte(
        "posted_at", start_date.strftime("%Y-%m-%d")
    ).order("posted_at", desc=True).execute()
    
    transactions = transactions_response.data if transactions_response.data else []
    
    # Get budgets
    budgets_response = supabase.table("budgets").select(
        "id, category, subcategory, cap_amount, period, is_active"
    ).eq("user_id", user_id).eq("is_active", True).execute()
    
    budgets = budgets_response.data if budgets_response.data else []
    
    # Get accounts and balances
    accounts_response = supabase.table("accounts").select("id, name, type").eq(
        "user_id", user_id
    ).execute()
    
    accounts = accounts_response.data if accounts_response.data else []
    
    # Get latest balance for each account
    total_balance = 0
    for account in accounts:
        balance_response = supabase.table("account_balances").select(
            "current, available, as_of"
        ).eq("account_id", account["id"]).order("as_of", desc=True).limit(1).execute()
        
        if balance_response.data:
            balance = balance_response.data[0]["current"]
            total_balance += balance if balance else 0
    
    # Compute profile metrics
    profile = await _compute_financial_metrics(
        transactions=transactions,
        budgets=budgets,
        total_balance=total_balance,
        days=days
    )
    
    return profile


async def _compute_financial_metrics(
    transactions: List[Dict],
    budgets: List[Dict],
    total_balance: float,
    days: int
) -> Dict[str, Any]:
    """
    Compute comprehensive financial metrics from raw data
    
    Returns detailed financial profile with income, expenses, patterns, etc.
    """
    if not transactions:
        return {
            "user_profile": {
                "total_balance": total_balance,
                "monthly_income": 0,
                "income_cadence": "unknown",
                "income_volatility": 0,
                "average_monthly_expenses": 0,
                "fixed_expenses": 0,
                "variable_expenses": 0,
                "discretionary_expenses": 0,
                "emergency_fund_months": 0,
                "current_dti_ratio": 0
            },
            "spending_by_category": {},
            "active_budgets": budgets,
            "obligations": {},
            "behavioral_profile": {
                "dining_vs_groceries_ratio": 0,
                "weekday_vs_weekend_ratio": 0,
                "elasticity_scores": {},
                "payment_stacking_dates": []
            }
        }
    
    # Separate income from expenses
    income_transactions = [t for t in transactions if t["amount"] > 0]
    expense_transactions = [t for t in transactions if t["amount"] < 0]
    
    # Calculate monthly income
    total_income = sum(t["amount"] for t in income_transactions)
    monthly_income = (total_income / days) * 30 if days > 0 else 0
    
    # Detect income cadence
    income_cadence = _detect_income_cadence(income_transactions)
    
    # Calculate income volatility (coefficient of variation)
    if len(income_transactions) > 1:
        income_amounts = [t["amount"] for t in income_transactions]
        income_std = statistics.stdev(income_amounts)
        income_mean = statistics.mean(income_amounts)
        income_volatility = (income_std / income_mean) if income_mean > 0 else 0
    else:
        income_volatility = 0
    
    # Calculate expenses
    total_expenses = sum(abs(t["amount"]) for t in expense_transactions)
    average_monthly_expenses = (total_expenses / days) * 30 if days > 0 else 0
    
    # Categorize expenses by flexibility
    fixed_expenses = 0
    variable_expenses = 0
    discretionary_expenses = 0
    
    spending_by_category = defaultdict(lambda: {"monthly_avg": 0, "trend": "stable", "count": 0})
    
    for txn in expense_transactions:
        category = txn.get("category", "other")
        subcategory = txn.get("subcategory", "")
        amount = abs(txn["amount"])
        
        # Add to category totals
        spending_by_category[category]["monthly_avg"] += amount
        spending_by_category[category]["count"] += 1
        
        # Categorize by flexibility based on elasticity
        elasticity = _get_elasticity(category, subcategory)
        
        if elasticity < 0.3:
            fixed_expenses += amount
        elif elasticity < 0.6:
            variable_expenses += amount
        else:
            discretionary_expenses += amount
    
    # Convert monthly averages
    for category in spending_by_category:
        total = spending_by_category[category]["monthly_avg"]
        spending_by_category[category]["monthly_avg"] = round((total / days) * 30, 2)
        
        # Determine trend (simple heuristic: compare first half vs second half)
        category_txns = [t for t in expense_transactions if t.get("category") == category]
        if len(category_txns) >= 4:
            mid = len(category_txns) // 2
            first_half_avg = sum(abs(t["amount"]) for t in category_txns[:mid]) / mid
            second_half_avg = sum(abs(t["amount"]) for t in category_txns[mid:]) / (len(category_txns) - mid)
            
            if second_half_avg > first_half_avg * 1.1:
                spending_by_category[category]["trend"] = "increasing"
            elif second_half_avg < first_half_avg * 0.9:
                spending_by_category[category]["trend"] = "decreasing"
            else:
                spending_by_category[category]["trend"] = "stable"
    
    # Normalize monthly averages
    monthly_fixed = (fixed_expenses / days) * 30
    monthly_variable = (variable_expenses / days) * 30
    monthly_discretionary = (discretionary_expenses / days) * 30
    
    # Calculate emergency fund months
    emergency_fund_months = (
        total_balance / average_monthly_expenses if average_monthly_expenses > 0 else 0
    )
    
    # Calculate DTI (assuming loan payments are in financial category)
    loan_payments = sum(
        abs(t["amount"]) for t in expense_transactions 
        if t.get("category") == "financial" and t.get("subcategory") in ["loan", "credit_card_payments"]
    )
    monthly_loan_payments = (loan_payments / days) * 30
    current_dti_ratio = (monthly_loan_payments / monthly_income) if monthly_income > 0 else 0
    
    # Extract obligations (recurring expenses)
    obligations = _extract_obligations(expense_transactions, days)
    
    # Compute behavioral profile
    behavioral_profile = _compute_behavioral_profile(expense_transactions, spending_by_category)
    
    return {
        "user_profile": {
            "total_balance": round(total_balance, 2),
            "monthly_income": round(monthly_income, 2),
            "income_cadence": income_cadence,
            "income_volatility": round(income_volatility, 2),
            "average_monthly_expenses": round(average_monthly_expenses, 2),
            "fixed_expenses": round(monthly_fixed, 2),
            "variable_expenses": round(monthly_variable, 2),
            "discretionary_expenses": round(monthly_discretionary, 2),
            "emergency_fund_months": round(emergency_fund_months, 1),
            "current_dti_ratio": round(current_dti_ratio, 2)
        },
        "spending_by_category": dict(spending_by_category),
        "active_budgets": budgets,
        "obligations": obligations,
        "behavioral_profile": behavioral_profile
    }


def _detect_income_cadence(income_transactions: List[Dict]) -> str:
    """Detect income payment frequency (weekly, biweekly, monthly, irregular)"""
    if len(income_transactions) < 2:
        return "unknown"
    
    # Calculate days between income transactions
    sorted_txns = sorted(income_transactions, key=lambda x: x["posted_at"])
    intervals = []
    
    for i in range(1, len(sorted_txns)):
        date1 = datetime.fromisoformat(str(sorted_txns[i-1]["posted_at"]))
        date2 = datetime.fromisoformat(str(sorted_txns[i]["posted_at"]))
        days_between = (date2 - date1).days
        intervals.append(days_between)
    
    if not intervals:
        return "unknown"
    
    avg_interval = statistics.mean(intervals)
    
    # Classify cadence
    if 6 <= avg_interval <= 8:
        return "weekly"
    elif 13 <= avg_interval <= 16:
        return "biweekly"
    elif 28 <= avg_interval <= 32:
        return "monthly"
    elif avg_interval > 60:
        return "quarterly"
    else:
        return "irregular"


def _get_elasticity(category: str, subcategory: str) -> float:
    """Get spending elasticity score for a category/subcategory"""
    category_lower = category.lower() if category else "other"
    subcategory_lower = subcategory.lower() if subcategory else ""
    
    # Check subcategory first
    if category_lower in DEFAULT_ELASTICITY_SCORES:
        category_scores = DEFAULT_ELASTICITY_SCORES[category_lower]
        if isinstance(category_scores, dict) and subcategory_lower in category_scores:
            return category_scores[subcategory_lower]
        elif isinstance(category_scores, dict):
            # Return average for category
            return sum(category_scores.values()) / len(category_scores)
    
    # Default elasticity
    return 0.5


def _extract_obligations(expense_transactions: List[Dict], days: int) -> Dict[str, float]:
    """Extract recurring fixed obligations (rent, utilities, subscriptions, etc.)"""
    obligations = {}
    
    # Group by merchant to detect recurring payments
    merchant_groups = defaultdict(list)
    for txn in expense_transactions:
        merchant = txn.get("merchant_name", txn.get("description", "unknown"))
        merchant_groups[merchant].append(abs(txn["amount"]))
    
    # Detect recurring payments (same merchant, similar amounts, multiple occurrences)
    for merchant, amounts in merchant_groups.items():
        if len(amounts) >= 2:
            avg_amount = statistics.mean(amounts)
            std_amount = statistics.stdev(amounts) if len(amounts) > 1 else 0
            
            # If std dev is low relative to mean, it's likely recurring
            if std_amount / avg_amount < 0.15:  # Low variance = recurring
                monthly_amount = (sum(amounts) / days) * 30
                
                # Categorize by merchant name patterns
                merchant_lower = merchant.lower()
                if any(word in merchant_lower for word in ["rent", "apartment", "landlord"]):
                    obligations["rent"] = round(monthly_amount, 2)
                elif any(word in merchant_lower for word in ["electric", "power", "utility"]):
                    obligations.setdefault("utilities", 0)
                    obligations["utilities"] += round(monthly_amount, 2)
                elif any(word in merchant_lower for word in ["netflix", "spotify", "subscription"]):
                    obligations.setdefault("subscriptions", 0)
                    obligations["subscriptions"] += round(monthly_amount, 2)
    
    return obligations


def _compute_behavioral_profile(
    expense_transactions: List[Dict],
    spending_by_category: Dict[str, Dict]
) -> Dict[str, Any]:
    """Compute behavioral spending metrics"""
    
    # Dining vs groceries ratio
    dining = spending_by_category.get("food", {}).get("monthly_avg", 0)
    groceries_data = spending_by_category.get("food", {})
    # For simplicity, assume 40% of food is groceries, 60% dining (can be refined)
    dining_vs_groceries_ratio = 1.5  # Default
    
    # Weekday vs weekend spending
    weekday_spending = 0
    weekend_spending = 0
    weekday_count = 0
    weekend_count = 0
    
    for txn in expense_transactions:
        try:
            txn_date = datetime.fromisoformat(str(txn["posted_at"]))
            amount = abs(txn["amount"])
            
            if txn_date.weekday() < 5:  # Monday-Friday
                weekday_spending += amount
                weekday_count += 1
            else:  # Saturday-Sunday
                weekend_spending += amount
                weekend_count += 1
        except:
            continue
    
    weekday_avg = weekday_spending / weekday_count if weekday_count > 0 else 0
    weekend_avg = weekend_spending / weekend_count if weekend_count > 0 else 0
    weekday_vs_weekend_ratio = (weekday_avg / weekend_avg) if weekend_avg > 0 else 1.0
    
    # Elasticity scores by category
    elasticity_scores = {}
    for category in spending_by_category.keys():
        elasticity_scores[category] = round(_get_elasticity(category, ""), 2)
    
    # Payment stacking dates (detect days with multiple high transactions)
    date_spending = defaultdict(lambda: {"count": 0, "total": 0})
    for txn in expense_transactions:
        try:
            txn_date = datetime.fromisoformat(str(txn["posted_at"]))
            day = txn_date.day
            amount = abs(txn["amount"])
            
            if amount > 50:  # Only count significant transactions
                date_spending[day]["count"] += 1
                date_spending[day]["total"] += amount
        except:
            continue
    
    # Find days with high transaction density
    payment_stacking_dates = [
        day for day, data in date_spending.items() 
        if data["count"] >= 2  # Multiple transactions on same day
    ]
    payment_stacking_dates = sorted(payment_stacking_dates)[:5]  # Top 5
    
    return {
        "dining_vs_groceries_ratio": round(dining_vs_groceries_ratio, 2),
        "weekday_vs_weekend_ratio": round(weekday_vs_weekend_ratio, 2),
        "elasticity_scores": elasticity_scores,
        "payment_stacking_dates": payment_stacking_dates
    }

