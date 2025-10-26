"""
Opportunity Cost Tools

Calculates opportunity costs of financial decisions.
Compares investing vs. prepaying debt, etc.
"""

from typing import Dict, Any, List


def calculate_investment_opportunity_cost(
    cash_outlay: float,
    monthly_payment: float,
    tenure_months: int,
    expected_return_rate: float = 0.07  # 7% annual average market return
) -> Dict[str, Any]:
    """
    Calculate what the money could earn if invested instead
    
    Args:
        cash_outlay: Down payment or upfront cost
        monthly_payment: Monthly payment amount
        tenure_months: Number of months
        expected_return_rate: Annual expected return rate
    
    Returns:
        Dict with investment opportunity cost analysis
    """
    monthly_return_rate = expected_return_rate / 12
    
    # Future value of down payment if invested
    fv_down_payment = cash_outlay * ((1 + monthly_return_rate) ** tenure_months)
    opportunity_cost_down_payment = fv_down_payment - cash_outlay
    
    # Future value of monthly payments if invested (annuity formula)
    if monthly_return_rate > 0:
        fv_monthly_payments = monthly_payment * (
            ((1 + monthly_return_rate) ** tenure_months - 1) / monthly_return_rate
        )
    else:
        fv_monthly_payments = monthly_payment * tenure_months
    
    total_invested = (monthly_payment * tenure_months) + cash_outlay
    opportunity_cost_monthly = fv_monthly_payments - (monthly_payment * tenure_months)
    
    total_opportunity_cost = opportunity_cost_down_payment + opportunity_cost_monthly
    
    return {
        "down_payment_opportunity_cost": round(opportunity_cost_down_payment, 2),
        "monthly_payments_opportunity_cost": round(opportunity_cost_monthly, 2),
        "total_opportunity_cost": round(total_opportunity_cost, 2),
        "future_value_if_invested": round(fv_down_payment + fv_monthly_payments, 2),
        "total_invested": round(total_invested, 2),
        "expected_return_rate_annual": expected_return_rate,
        "tenure_months": tenure_months
    }


def compare_invest_vs_prepay_debt(
    user_profile: Dict[str, Any],
    available_cash: float,
    new_loan_apr: float = 0.0
) -> Dict[str, Any]:
    """
    Compare opportunity cost of using cash vs. keeping it invested
    
    Args:
        user_profile: User's financial profile
        available_cash: Amount of cash being considered
        new_loan_apr: APR of new debt (if financing)
    
    Returns:
        Dict with comparison analysis
    """
    # Assumed market return
    market_return = 0.07  # 7% annual
    
    # Existing debt APRs from user profile (if available)
    existing_loans = user_profile.get("loans", [])
    
    recommendations = []
    
    # If user has high-interest debt, recommend paying that off first
    for loan in existing_loans:
        loan_apr = loan.get("apr", 0)
        if loan_apr > market_return:
            guaranteed_return = loan_apr - market_return
            recommendations.append({
                "action": "prepay_existing_debt",
                "loan_type": loan.get("type", "unknown"),
                "apr": loan_apr,
                "guaranteed_return": round(guaranteed_return, 4),
                "reasoning": f"Guaranteed {guaranteed_return*100:.1f}% return by prepaying {loan_apr*100:.1f}% debt vs. risky {market_return*100}% market return"
            })
    
    # Compare new loan APR to market return
    if new_loan_apr > 0:
        if new_loan_apr > market_return:
            recommendations.append({
                "action": "increase_down_payment",
                "new_loan_apr": new_loan_apr,
                "reasoning": f"Loan APR ({new_loan_apr*100:.1f}%) exceeds expected market return ({market_return*100}%), consider larger down payment"
            })
        else:
            recommendations.append({
                "action": "minimize_down_payment",
                "new_loan_apr": new_loan_apr,
                "reasoning": f"Loan APR ({new_loan_apr*100:.1f}%) below market return ({market_return*100}%), keeping cash invested may yield better returns"
            })
    
    return {
        "market_return_annual": market_return,
        "new_loan_apr": new_loan_apr,
        "recommendations": recommendations,
        "high_interest_debt_exists": any(loan.get("apr", 0) > market_return for loan in existing_loans)
    }


def calculate_deferral_opportunity_cost(
    monthly_surplus: float,
    deferral_months: int,
    expected_return_rate: float = 0.07
) -> Dict[str, Any]:
    """
    Calculate benefit of deferring a purchase
    
    Useful for travel timing decisions: "What if I wait 3 months?"
    
    Args:
        monthly_surplus: Monthly surplus that could be saved
        deferral_months: How many months to defer
        expected_return_rate: Annual return rate on savings
    
    Returns:
        Dict with deferral analysis
    """
    monthly_return_rate = expected_return_rate / 12
    
    # Future value of monthly savings
    if monthly_return_rate > 0:
        fv_savings = monthly_surplus * (
            ((1 + monthly_return_rate) ** deferral_months - 1) / monthly_return_rate
        )
    else:
        fv_savings = monthly_surplus * deferral_months
    
    simple_savings = monthly_surplus * deferral_months
    investment_gain = fv_savings - simple_savings
    
    return {
        "deferral_months": deferral_months,
        "monthly_surplus": monthly_surplus,
        "simple_savings": round(simple_savings, 2),
        "investment_gain": round(investment_gain, 2),
        "total_available_after_deferral": round(fv_savings, 2),
        "benefit": f"Waiting {deferral_months} months accumulates ${fv_savings:.2f} (${investment_gain:.2f} growth)"
    }

