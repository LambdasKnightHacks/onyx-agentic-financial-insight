"""
Home TCO Calculator

Calculates Total Cost of Ownership for mortgage vs rent decisions.
Includes: mortgage payments, property tax, HOA, maintenance, insurance, appreciation.
"""

from typing import Dict, Any


def calculate_home_tco(
    option_type: str,
    params: Dict[str, Any],
    tenure_months: int = 60
) -> Dict[str, Any]:
    """
    Calculate comprehensive TCO for buying (mortgage) vs renting
    
    Args:
        option_type: "mortgage" or "rent"
        params: Dictionary with option-specific parameters
        tenure_months: Analysis period in months
    
    Returns:
        Complete TCO breakdown
    """
    
    if option_type == "mortgage":
        return _calculate_mortgage_tco(params, tenure_months)
    elif option_type == "rent":
        return _calculate_rent_tco(params, tenure_months)
    else:
        raise ValueError(f"Invalid option_type: {option_type}")


def _calculate_mortgage_tco(params: Dict[str, Any], tenure_months: int) -> Dict[str, Any]:
    """Calculate TCO for mortgage/buying"""
    
    home_price = params.get("home_price", 0)
    down_payment = params.get("down_payment", 0)
    apr = params.get("apr", 0.065)
    loan_term_months = params.get("loan_term_months", 360)  # 30 years
    property_tax_annual = params.get("property_tax_annual", home_price * 0.012)
    hoa_monthly = params.get("hoa_monthly", 0)
    insurance_monthly = params.get("insurance_monthly", home_price / 12 / 1000)
    maintenance_annual = params.get("maintenance_annual", home_price * 0.01)
    appreciation_rate_annual = params.get("appreciation_rate", 0.03)
    
    # Mortgage calculation
    principal = home_price - down_payment
    monthly_rate = apr / 12
    
    if monthly_rate > 0:
        monthly_payment = principal * (
            monthly_rate * (1 + monthly_rate)**loan_term_months
        ) / ((1 + monthly_rate)**loan_term_months - 1)
    else:
        monthly_payment = principal / loan_term_months
    
    # Total payments during tenure
    mortgage_payments = monthly_payment * min(tenure_months, loan_term_months)
    
    # Other costs
    property_tax = property_tax_annual * (tenure_months / 12)
    hoa_fees = hoa_monthly * tenure_months
    insurance = insurance_monthly * tenure_months
    maintenance = maintenance_annual * (tenure_months / 12)
    
    # Home appreciation
    years = tenure_months / 12
    future_value = home_price * ((1 + appreciation_rate_annual) ** years)
    appreciation = future_value - home_price
    
    # Calculate remaining loan balance
    if tenure_months < loan_term_months and monthly_rate > 0:
        remaining_balance = principal * (
            (1 + monthly_rate)**tenure_months
        ) - monthly_payment * (
            ((1 + monthly_rate)**tenure_months - 1) / monthly_rate
        )
    else:
        remaining_balance = 0
    
    # Gross costs
    gross_tco = (
        down_payment +
        mortgage_payments +
        property_tax +
        hoa_fees +
        insurance +
        maintenance
    )
    
    # Net TCO (accounting for home value and remaining loan)
    equity = future_value - remaining_balance
    net_tco = gross_tco - equity
    
    return {
        "option_type": "mortgage",
        "tco_expected": round(net_tco, 2),
        "tco_range": [round(net_tco * 0.85, 2), round(net_tco * 1.15, 2)],
        "tco_breakdown": {
            "down_payment": round(down_payment, 2),
            "mortgage_payments": round(mortgage_payments, 2),
            "property_tax": round(property_tax, 2),
            "hoa_fees": round(hoa_fees, 2),
            "insurance": round(insurance, 2),
            "maintenance": round(maintenance, 2),
            "home_value_gain": round(-appreciation, 2),
            "remaining_loan": round(remaining_balance, 2)
        },
        "monthly_equivalent": round(monthly_payment, 2),
        "equity_built": round(equity, 2),
        "residual_value": round(future_value, 2)
    }


def _calculate_rent_tco(params: Dict[str, Any], tenure_months: int) -> Dict[str, Any]:
    """Calculate TCO for renting"""
    
    monthly_rent = params.get("monthly_rent", 0)
    security_deposit = params.get("security_deposit", monthly_rent * 1)
    renters_insurance_monthly = params.get("renters_insurance_monthly", 20)
    utilities_monthly = params.get("utilities_monthly", 150)
    rent_increase_annual = params.get("rent_increase_annual", 0.03)
    
    # Calculate rent with annual increases
    total_rent = 0
    current_rent = monthly_rent
    
    for month in range(tenure_months):
        total_rent += current_rent
        # Increase rent annually
        if (month + 1) % 12 == 0:
            current_rent *= (1 + rent_increase_annual)
    
    # Other costs
    insurance = renters_insurance_monthly * tenure_months
    utilities = utilities_monthly * tenure_months
    
    # Total TCO (security deposit returned at end, so excluded)
    tco_expected = total_rent + insurance + utilities
    
    return {
        "option_type": "rent",
        "tco_expected": round(tco_expected, 2),
        "tco_range": [round(tco_expected * 0.95, 2), round(tco_expected * 1.05, 2)],
        "tco_breakdown": {
            "rent_payments": round(total_rent, 2),
            "insurance": round(insurance, 2),
            "utilities": round(utilities, 2)
        },
        "monthly_equivalent": round(tco_expected / tenure_months, 2),
        "equity_built": 0,
        "residual_value": 0
    }

