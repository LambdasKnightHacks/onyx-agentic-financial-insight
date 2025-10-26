"""
Car TCO Calculator

Calculates Total Cost of Ownership for car lease vs finance decisions.
Includes all costs: payments, fees, insurance, fuel, maintenance, registration, depreciation.
"""

from typing import Dict, Any
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))))

from decision_agent.config import CAR_DECISION_DEFAULTS


def calculate_car_tco(
    option_type: str,
    params: Dict[str, Any],
    tenure_months: int = 36
) -> Dict[str, Any]:
    """
    Calculate comprehensive TCO for car lease or finance
    
    Args:
        option_type: "lease" or "finance"
        params: Dictionary with option-specific parameters
        tenure_months: Analysis period in months
    
    Returns:
        Complete TCO breakdown with expected cost, range, and details
    """
    
    if option_type == "lease":
        return _calculate_lease_tco(params, tenure_months)
    elif option_type == "finance":
        return _calculate_finance_tco(params, tenure_months)
    else:
        raise ValueError(f"Invalid option_type: {option_type}. Must be 'lease' or 'finance'")


def _calculate_lease_tco(params: Dict[str, Any], tenure_months: int) -> Dict[str, Any]:
    """Calculate TCO for lease option"""
    
    # Required params with defaults
    monthly_payment = params.get("monthly_payment", 0)
    down_payment = params.get("down_payment", 0)
    acquisition_fee = params.get("acquisition_fee", 595)
    disposition_fee = params.get("disposition_fee", 395)
    miles_per_year = params.get("miles_per_year", 12000)
    mileage_cap = params.get("mileage_cap", 12000)
    overage_fee_per_mile = params.get("overage_fee_per_mile", 0.25)
    
    # Common costs
    insurance_monthly = params.get("insurance_monthly", CAR_DECISION_DEFAULTS["default_insurance_monthly"])
    fuel_monthly = params.get("fuel_monthly", CAR_DECISION_DEFAULTS["default_fuel_monthly"])
    maintenance_monthly = params.get("maintenance_monthly", CAR_DECISION_DEFAULTS["default_maintenance_monthly_lease"])
    registration_annual = params.get("registration_annual", CAR_DECISION_DEFAULTS["default_registration_annual"])
    parking_tolls_monthly = params.get("parking_tolls_monthly", 0)
    
    # Lease-specific calculations
    total_payments = monthly_payment * tenure_months
    fees = acquisition_fee + disposition_fee
    
    # Calculate mileage overage risk
    expected_miles = miles_per_year * (tenure_months / 12)
    total_mileage_cap = mileage_cap * (tenure_months / 12)
    overage_miles = max(0, expected_miles - total_mileage_cap)
    overage_risk = overage_miles * overage_fee_per_mile
    
    # Common costs over tenure
    insurance_total = insurance_monthly * tenure_months
    fuel_total = fuel_monthly * tenure_months
    maintenance_total = maintenance_monthly * tenure_months
    registration_total = registration_annual * (tenure_months / 12)
    parking_total = parking_tolls_monthly * tenure_months
    
    # Calculate TCO
    tco_expected = (
        down_payment +
        total_payments +
        fees +
        overage_risk +
        insurance_total +
        fuel_total +
        maintenance_total +
        registration_total +
        parking_total
    )
    
    # TCO range (±8% for uncertainty)
    tco_min = tco_expected * 0.92
    tco_max = tco_expected * 1.08
    
    # Money factor to APR conversion (if provided)
    money_factor = params.get("money_factor", 0)
    money_factor_apr = money_factor * 2400 if money_factor else None
    
    return {
        "option_type": "lease",
        "tco_expected": round(tco_expected, 2),
        "tco_range": [round(tco_min, 2), round(tco_max, 2)],
        "tco_breakdown": {
            "down_payment": round(down_payment, 2),
            "payments": round(total_payments, 2),
            "fees": round(fees, 2),
            "overage_risk": round(overage_risk, 2),
            "insurance": round(insurance_total, 2),
            "fuel": round(fuel_total, 2),
            "maintenance": round(maintenance_total, 2),
            "registration": round(registration_total, 2),
            "parking": round(parking_total, 2)
        },
        "monthly_equivalent": round(tco_expected / tenure_months, 2),
        "residual_value": 0,  # No ownership with lease
        "money_factor_apr": money_factor_apr,
        "mileage_analysis": {
            "annual_allowance": mileage_cap,
            "expected_annual_usage": miles_per_year,
            "total_allowance": round(total_mileage_cap, 0),
            "expected_total_usage": round(expected_miles, 0),
            "overage_miles": round(overage_miles, 0),
            "overage_cost": round(overage_risk, 2),
            "overage_risk_level": "low" if overage_miles == 0 else "medium" if overage_miles < 1000 else "high"
        }
    }


def _calculate_finance_tco(params: Dict[str, Any], tenure_months: int) -> Dict[str, Any]:
    """Calculate TCO for finance option"""
    
    # Required params
    purchase_price = params.get("purchase_price", 0)
    down_payment = params.get("down_payment", 0)
    apr = params.get("apr", 0.05)
    loan_term_months = params.get("loan_term_months", 60)
    trade_in_value = params.get("trade_in_value", 0)
    
    # Common costs
    insurance_monthly = params.get("insurance_monthly", CAR_DECISION_DEFAULTS["default_insurance_monthly"])
    fuel_monthly = params.get("fuel_monthly", CAR_DECISION_DEFAULTS["default_fuel_monthly"])
    maintenance_monthly = params.get("maintenance_monthly", CAR_DECISION_DEFAULTS["default_maintenance_monthly_finance"])
    registration_annual = params.get("registration_annual", CAR_DECISION_DEFAULTS["default_registration_annual"])
    parking_tolls_monthly = params.get("parking_tolls_monthly", 0)
    
    # Finance calculations
    principal = purchase_price - down_payment - trade_in_value
    monthly_rate = apr / 12
    
    # Calculate monthly payment (amortization formula)
    if monthly_rate > 0:
        monthly_payment = principal * (
            monthly_rate * (1 + monthly_rate)**loan_term_months
        ) / (
            (1 + monthly_rate)**loan_term_months - 1
        )
    else:
        monthly_payment = principal / loan_term_months if loan_term_months > 0 else 0
    
    # Total interest over full loan term
    total_loan_payments = monthly_payment * loan_term_months
    total_interest = total_loan_payments - principal
    
    # Payments during our analysis tenure
    actual_payments = monthly_payment * min(tenure_months, loan_term_months)
    
    # Remaining balance if tenure < loan term
    if tenure_months < loan_term_months and monthly_rate > 0:
        # Remaining balance formula
        remaining_balance = principal * (
            (1 + monthly_rate)**tenure_months
        ) - monthly_payment * (
            ((1 + monthly_rate)**tenure_months - 1) / monthly_rate
        )
        remaining_balance = max(0, remaining_balance)
    else:
        remaining_balance = 0
    
    # Resale value estimation (depreciation curve)
    years_owned = tenure_months / 12
    
    # Depreciation: 15% first year, 10% each subsequent year
    if years_owned <= 1:
        depreciation_rate = CAR_DECISION_DEFAULTS["depreciation_year_1"] * years_owned
    else:
        # First year + subsequent years
        total_depreciation = CAR_DECISION_DEFAULTS["depreciation_year_1"]
        remaining_years = years_owned - 1
        total_depreciation += CAR_DECISION_DEFAULTS["depreciation_subsequent"] * remaining_years
        depreciation_rate = min(total_depreciation, 0.70)  # Cap at 70% depreciation
    
    resale_value = purchase_price * (1 - depreciation_rate)
    
    # Common costs
    insurance_total = insurance_monthly * tenure_months
    fuel_total = fuel_monthly * tenure_months
    maintenance_total = maintenance_monthly * tenure_months
    registration_total = registration_annual * (tenure_months / 12)
    parking_total = parking_tolls_monthly * tenure_months
    
    # Calculate gross TCO (all money out)
    gross_tco = (
        down_payment +
        actual_payments +
        insurance_total +
        fuel_total +
        maintenance_total +
        registration_total +
        parking_total
    )
    
    # Calculate net TCO (accounting for resale value and remaining loan)
    net_tco = gross_tco - resale_value + remaining_balance
    
    # TCO range (±10% for uncertainty - higher than lease due to resale uncertainty)
    tco_min = net_tco * 0.90
    tco_max = net_tco * 1.10
    
    # Calculate equity built
    equity_built = resale_value - remaining_balance
    
    # Interest paid during tenure
    interest_during_tenure = actual_payments - (principal - remaining_balance)
    
    return {
        "option_type": "finance",
        "tco_expected": round(net_tco, 2),
        "tco_range": [round(tco_min, 2), round(tco_max, 2)],
        "tco_breakdown": {
            "down_payment": round(down_payment, 2),
            "loan_payments": round(actual_payments, 2),
            "interest_paid": round(interest_during_tenure, 2),
            "insurance": round(insurance_total, 2),
            "fuel": round(fuel_total, 2),
            "maintenance": round(maintenance_total, 2),
            "registration": round(registration_total, 2),
            "parking": round(parking_total, 2),
            "resale_value": round(-resale_value, 2),  # Negative because it reduces TCO
            "remaining_loan": round(remaining_balance, 2)
        },
        "monthly_equivalent": round(monthly_payment, 2),
        "residual_value": round(resale_value, 2),
        "apr": apr,
        "equity_built": round(equity_built, 2),
        "loan_details": {
            "principal": round(principal, 2),
            "monthly_payment": round(monthly_payment, 2),
            "total_interest_if_full_term": round(total_interest, 2),
            "remaining_balance_after_tenure": round(remaining_balance, 2),
            "loan_term_months": loan_term_months,
            "analysis_tenure_months": tenure_months
        }
    }

