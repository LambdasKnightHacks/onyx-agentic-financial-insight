"""
Configuration for Financial Decision Analysis Agent

Centralized configuration for decision analysis system including:
- Database connections
- LLM model settings
- Decision thresholds and rules
- Stress test scenario parameters
"""

import os
from supabase import create_client
from typing import Dict, Any

# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def get_supabase_client():
    """Get Supabase client instance"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ============================================================================
# LLM CONFIGURATION
# ============================================================================

# Use fast model for real-time streaming
LLM_MODEL = "gemini-2.0-flash-exp"

# Google Cloud Project (from existing config)
GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")

# ============================================================================
# DECISION ANALYSIS THRESHOLDS
# ============================================================================

DECISION_THRESHOLDS = {
    # Liquidity thresholds
    "low_liquidity_score": 0.4,  # Below this = concerning liquidity
    "good_liquidity_score": 0.7,  # Above this = healthy liquidity
    
    # Risk thresholds
    "high_runway_breach_prob": 0.15,  # >15% chance of running out of money = high risk
    "critical_runway_days": 30,  # <30 days runway = critical
    "warning_runway_days": 60,  # <60 days runway = warning
    
    # Debt-to-Income (DTI) thresholds
    "critical_dti_ratio": 0.36,  # >36% DTI = critical (FHA mortgage limit)
    "warning_dti_ratio": 0.28,  # >28% DTI = warning (conventional loan preference)
    "optimal_dti_ratio": 0.20,  # <20% DTI = optimal
    
    # Emergency fund thresholds
    "min_emergency_fund_months": 3,  # Minimum recommended emergency fund
    "optimal_emergency_fund_months": 6,  # Optimal emergency fund
    
    # Payment-to-income thresholds
    "max_payment_to_income_ratio": 0.15,  # Vehicle/housing payment should be <15% of income
    "warning_payment_to_income_ratio": 0.20,  # Warning level
}

# ============================================================================
# STRESS TEST SCENARIOS
# ============================================================================

STRESS_SCENARIOS: Dict[str, Dict[str, Any]] = {
    "income_drop_10": {
        "name": "Income Drop 10%",
        "type": "income_drop",
        "parameters": {"income_change": -0.10},
        "description": "Simulate 10% reduction in monthly income"
    },
    "income_drop_20": {
        "name": "Income Drop 20%",
        "type": "income_drop",
        "parameters": {"income_change": -0.20},
        "description": "Simulate 20% reduction in monthly income (job loss scenario)"
    },
    "expense_spike_500": {
        "name": "Expense Spike +$500",
        "type": "expense_spike",
        "parameters": {"expense_increase": 500},
        "description": "Simulate $500 unexpected monthly expense increase"
    },
    "expense_spike_1000": {
        "name": "Expense Spike +$1000",
        "type": "expense_spike",
        "parameters": {"expense_increase": 1000},
        "description": "Simulate $1000 unexpected monthly expense increase"
    },
    "interest_rate_up_1": {
        "name": "Interest Rate Increase 1%",
        "type": "interest_rate_shock",
        "parameters": {"rate_increase": 0.01},
        "description": "Simulate 1% APR increase on financing"
    },
    "interest_rate_up_2": {
        "name": "Interest Rate Increase 2%",
        "type": "interest_rate_shock",
        "parameters": {"rate_increase": 0.02},
        "description": "Simulate 2% APR increase on financing"
    },
    "emergency_2k": {
        "name": "Emergency Expense $2,000",
        "type": "emergency_expense",
        "parameters": {"one_time_expense": 2000},
        "description": "Simulate one-time $2,000 emergency expense"
    },
    "emergency_5k": {
        "name": "Emergency Expense $5,000",
        "type": "emergency_expense",
        "parameters": {"one_time_expense": 5000},
        "description": "Simulate one-time $5,000 emergency expense"
    }
}

# ============================================================================
# CATEGORY ELASTICITY DEFAULTS
# ============================================================================
# How flexible each spending category is (0.0 = fixed, 1.0 = highly flexible)

DEFAULT_ELASTICITY_SCORES = {
    "food": {
        "dining": 0.85,  # Highly elastic - easy to cook at home
        "groceries": 0.40,  # Somewhat elastic - can buy cheaper brands
        "coffee_tea": 0.80,  # Highly elastic - can make at home
        "bars": 0.90,  # Very elastic - entertainment expense
    },
    "transportation": {
        "gas": 0.30,  # Low elasticity - need to commute
        "public_transit": 0.20,  # Low elasticity - need to get around
        "rideshare": 0.85,  # Highly elastic - can use alternatives
        "car_maintenance": 0.10,  # Very inelastic - safety critical
    },
    "shopping": {
        "clothing": 0.75,  # Elastic - can delay purchases
        "electronics": 0.90,  # Highly elastic - wants not needs
        "household": 0.60,  # Somewhat elastic
        "online": 0.80,  # Highly elastic - impulse purchases
    },
    "entertainment": {
        "streaming": 0.95,  # Very elastic - can cancel anytime
        "subscriptions": 0.95,  # Very elastic - often unused
        "movies": 0.85,  # Elastic - discretionary
        "events": 0.80,  # Elastic - discretionary
        "games": 0.85,  # Elastic - discretionary
    },
    "living": {
        "rent": 0.05,  # Very inelastic - fixed cost
        "mortgage": 0.05,  # Very inelastic - fixed cost
        "utilities": 0.20,  # Low elasticity - can reduce slightly
        "internet": 0.15,  # Low elasticity - essential
    },
    "healthcare": {
        "insurance": 0.10,  # Very inelastic - essential
        "prescriptions": 0.10,  # Very inelastic - essential
        "doctor": 0.30,  # Low elasticity - health is important
    },
    "financial": {
        "loan": 0.05,  # Very inelastic - contractual obligation
        "credit_card_payments": 0.10,  # Very inelastic - mandatory
        "bank_fees": 0.50,  # Somewhat elastic - can shop around
    }
}

# ============================================================================
# CAR DECISION DEFAULTS
# ============================================================================

CAR_DECISION_DEFAULTS = {
    "depreciation_year_1": 0.15,  # 15% depreciation in year 1
    "depreciation_subsequent": 0.10,  # 10% depreciation per year after
    "default_insurance_monthly": 120,
    "default_fuel_monthly": 80,
    "default_maintenance_monthly_lease": 25,  # Lower for lease (warranty)
    "default_maintenance_monthly_finance": 50,  # Higher for ownership
    "default_registration_annual": 150,
}

# ============================================================================
# VALIDATION RULES
# ============================================================================

VALIDATION_RULES = {
    "min_analysis_balance": 100,  # Minimum account balance to analyze decisions
    "max_processing_time_seconds": 30,  # Timeout for analysis
    "min_monthly_income": 500,  # Minimum monthly income to provide recommendations
}

# ============================================================================
# WEBSOCKET CONFIGURATION
# ============================================================================

WEBSOCKET_CONFIG = {
    "ping_interval_seconds": 30,
    "connection_timeout_seconds": 60,
    "max_message_size_bytes": 1024 * 1024,  # 1MB
}

