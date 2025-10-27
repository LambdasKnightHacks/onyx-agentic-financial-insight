"""
Risk and Liquidity Assessment Tools

Functions for calculating:
- Financial runway impact
- Stress test scenarios
- Liquidity scores
- DTI ratio changes
- Emergency fund adequacy
"""

from typing import Dict, Any, List
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from decision_agent.config import STRESS_SCENARIOS, DECISION_THRESHOLDS


def calculate_runway_impact(
    current_balance: float,
    monthly_payment: float,
    avg_daily_spend: float,
    down_payment: float = 0
) -> Dict[str, Any]:
    """
    Calculate impact on financial runway (days until money runs out)
    
    Args:
        current_balance: Current account balance
        monthly_payment: New monthly payment for decision
        avg_daily_spend: Current average daily spending
        down_payment: Upfront payment that reduces balance
    
    Returns:
        Runway impact analysis
    """
    # Calculate current runway
    current_runway = int(current_balance / avg_daily_spend) if avg_daily_spend > 0 else 999
    
    # Calculate new runway after decision
    new_balance = current_balance - down_payment
    new_daily_spend = avg_daily_spend + (monthly_payment / 30)
    new_runway = int(new_balance / new_daily_spend) if new_daily_spend > 0 else 999
    
    # Calculate breach probability (simple heuristic)
    breach_prob_6mo = _calculate_breach_probability(new_balance, new_daily_spend, 180)
    
    # Determine severity
    if new_runway < DECISION_THRESHOLDS["critical_runway_days"]:
        severity = "critical"
    elif new_runway < DECISION_THRESHOLDS["warning_runway_days"]:
        severity = "warn"
    else:
        severity = "info"
    
    return {
        "current_runway_days": current_runway,
        "new_runway_days": new_runway,
        "runway_delta": new_runway - current_runway,
        "runway_breach_probability_6mo": round(breach_prob_6mo, 3),
        "severity": severity,
        "daily_burn_rate_current": round(avg_daily_spend, 2),
        "daily_burn_rate_new": round(new_daily_spend, 2)
    }


def _calculate_breach_probability(balance: float, daily_spend: float, days: int) -> float:
    """
    Calculate probability of running out of money within N days
    
    Simple model: assumes 10% spending volatility
    """
    if daily_spend <= 0:
        return 0.0
    
    expected_balance = balance - (daily_spend * days)
    
    # Simple probability based on buffer
    if expected_balance < 0:
        # Will definitely run out
        return min(1.0, abs(expected_balance) / balance)
    elif expected_balance < balance * 0.1:
        # Low buffer - moderate risk
        return 0.20
    elif expected_balance < balance * 0.3:
        # Decent buffer - low risk
        return 0.05
    else:
        # Good buffer - very low risk
        return 0.01


def run_stress_scenarios(
    user_profile: Dict[str, Any],
    new_payment: float,
    down_payment: float
) -> List[Dict[str, Any]]:
    """
    Run multiple stress test scenarios to assess resilience
    
    Tests:
    - Income drops (10%, 20%)
    - Expense spikes ($500, $1000)
    - Emergency expenses ($2k, $5k)
    
    Returns:
        List of scenario results with impact and risk level
    """
    scenarios = []
    
    monthly_income = user_profile.get("monthly_income", 0)
    current_expenses = user_profile.get("average_monthly_expenses", 0)
    total_balance = user_profile.get("total_balance", 0)
    
    # New financial state after decision
    new_balance = total_balance - down_payment
    new_monthly_expenses = current_expenses + new_payment
    
    # Income drop scenarios
    for scenario_key in ["income_drop_10", "income_drop_20"]:
        scenario_config = STRESS_SCENARIOS[scenario_key]
        drop_pct = abs(scenario_config["parameters"]["income_change"])
        
        new_income = monthly_income * (1 - drop_pct)
        margin = new_income - new_monthly_expenses
        
        can_sustain = margin > 0
        
        if margin < 0:
            # Burning through savings
            months_until_depleted = new_balance / abs(margin) if margin < 0 else 999
            risk_level = "critical" if months_until_depleted < 3 else "high"
        else:
            months_until_depleted = None
            risk_level = "medium"
        
        scenarios.append({
            "name": scenario_config["name"],
            "type": scenario_config["type"],
            "parameters": scenario_config["parameters"],
            "impact": {
                "new_monthly_income": round(new_income, 2),
                "new_monthly_expenses": round(new_monthly_expenses, 2),
                "new_monthly_margin": round(margin, 2),
                "can_sustain": can_sustain,
                "emergency_fund_depletion_months": round(months_until_depleted, 1) if months_until_depleted else None
            },
            "risk_level": risk_level,
            "verdict": _generate_scenario_verdict(scenario_config["name"], margin, can_sustain)
        })
    
    # Expense spike scenarios
    for scenario_key in ["expense_spike_500", "expense_spike_1000"]:
        scenario_config = STRESS_SCENARIOS[scenario_key]
        spike = scenario_config["parameters"]["expense_increase"]
        
        spike_expenses = new_monthly_expenses + spike
        margin = monthly_income - spike_expenses
        can_sustain = margin > 0
        
        risk_level = "high" if margin < 0 else "medium"
        
        scenarios.append({
            "name": scenario_config["name"],
            "type": scenario_config["type"],
            "parameters": scenario_config["parameters"],
            "impact": {
                "new_monthly_expenses": round(spike_expenses, 2),
                "new_monthly_margin": round(margin, 2),
                "can_sustain": can_sustain
            },
            "risk_level": risk_level,
            "verdict": _generate_scenario_verdict(scenario_config["name"], margin, can_sustain)
        })
    
    # Emergency expense scenarios
    for scenario_key in ["emergency_2k", "emergency_5k"]:
        scenario_config = STRESS_SCENARIOS[scenario_key]
        emergency = scenario_config["parameters"]["one_time_expense"]
        
        remaining_fund = new_balance - emergency
        months_covered = remaining_fund / new_monthly_expenses if new_monthly_expenses > 0 else 999
        below_threshold = months_covered < DECISION_THRESHOLDS["min_emergency_fund_months"]
        
        risk_level = "critical" if months_covered < 2 else "medium" if below_threshold else "low"
        
        scenarios.append({
            "name": scenario_config["name"],
            "type": scenario_config["type"],
            "parameters": scenario_config["parameters"],
            "impact": {
                "remaining_emergency_fund": round(remaining_fund, 2),
                "months_covered": round(months_covered, 1),
                "below_3mo_threshold": below_threshold
            },
            "risk_level": risk_level,
            "verdict": _generate_scenario_verdict(scenario_config["name"], months_covered, not below_threshold)
        })
    
    return scenarios


def _generate_scenario_verdict(scenario_name: str, metric: float, is_safe: bool) -> str:
    """Generate human-readable verdict for scenario"""
    if "Income Drop" in scenario_name:
        if metric > 500:
            return f"Manageable - You'd still have ${metric:,.0f}/month positive margin"
        elif metric > 0:
            return f"Risky - Only ${metric:,.0f}/month margin; budget cuts would be essential"
        else:
            return f"Unsustainable - Would need to tap emergency fund immediately"
    
    elif "Expense Spike" in scenario_name:
        if metric > 0:
            return "Absorbable - Emergency fund can cover temporary spike"
        else:
            return "Difficult - Would need immediate budget rebalancing"
    
    elif "Emergency Expense" in scenario_name:
        if metric > 3:
            return f"Manageable - Emergency fund remains adequate with {metric:.1f} months coverage"
        elif metric > 1.5:
            return f"Concerning - Emergency fund dips to {metric:.1f} months; rebuild immediately"
        else:
            return f"Critical - Emergency fund severely depleted to {metric:.1f} months"
    
    return "Analysis complete"


def calculate_liquidity_score(
    user_profile: Dict[str, Any],
    down_payment: float,
    monthly_payment: float
) -> float:
    """
    Calculate 0-1 liquidity score after decision
    
    Factors:
    - Emergency fund adequacy (40%)
    - Payment-to-income ratio (35%)
    - Financial runway (25%)
    
    Returns:
        Score from 0.0 (poor liquidity) to 1.0 (excellent liquidity)
    """
    total_balance = user_profile.get("total_balance", 0)
    monthly_income = user_profile.get("monthly_income", 1)
    current_expenses = user_profile.get("average_monthly_expenses", 0)
    
    # New financial state
    new_balance = total_balance - down_payment
    new_monthly_expenses = current_expenses + monthly_payment
    
    # Factor 1: Emergency fund score (0-1)
    ef_months = new_balance / new_monthly_expenses if new_monthly_expenses > 0 else 12
    ef_score = max(0.0, min(1.0, ef_months / DECISION_THRESHOLDS["optimal_emergency_fund_months"]))
    
    # Factor 2: Payment-to-income ratio score (0-1)
    pti_ratio = new_monthly_expenses / monthly_income if monthly_income > 0 else 1.0
    # Good if <50%, perfect if <30%
    if pti_ratio < 0.30:
        pti_score = 1.0
    elif pti_ratio < 0.50:
        pti_score = 1.0 - ((pti_ratio - 0.30) / 0.20) * 0.3  # Linear decay
    else:
        pti_score = max(0, 0.7 - ((pti_ratio - 0.50) / 0.20) * 0.7)
    
    # Factor 3: Runway score (0-1)
    daily_spend = new_monthly_expenses / 30
    runway_days = int(new_balance / daily_spend) if daily_spend > 0 else 365
    # Perfect if >180 days, scales down
    runway_score = min(1.0, runway_days / 180)
    
    # Weighted average
    liquidity_score = (
        ef_score * 0.40 +
        pti_score * 0.35 +
        runway_score * 0.25
    )
    
    return round(liquidity_score, 2)


def assess_overall_risk(
    liquidity_score: float,
    runway_impact: Dict[str, Any],
    stress_scenarios: List[Dict[str, Any]],
    dti_ratio_new: float
) -> Dict[str, Any]:
    """
    Assess overall financial risk of the decision
    
    Returns:
        Risk assessment with overall level and specific flags
    """
    risk_factors = []
    green_flags = []
    
    # Check liquidity
    if liquidity_score < DECISION_THRESHOLDS["low_liquidity_score"]:
        risk_factors.append({
            "factor": "Low Liquidity",
            "severity": "high",
            "description": f"Liquidity score ({liquidity_score:.2f}) below healthy threshold",
            "mitigation": "Build emergency fund before proceeding"
        })
    elif liquidity_score >= DECISION_THRESHOLDS["good_liquidity_score"]:
        green_flags.append(f"Strong liquidity score ({liquidity_score:.2f})")
    
    # Check runway
    new_runway = runway_impact["new_runway_days"]
    if new_runway < DECISION_THRESHOLDS["critical_runway_days"]:
        risk_factors.append({
            "factor": "Critical Runway",
            "severity": "critical",
            "description": f"Only {new_runway} days of runway remaining",
            "mitigation": "Increase income or reduce expenses immediately"
        })
    elif new_runway < DECISION_THRESHOLDS["warning_runway_days"]:
        risk_factors.append({
            "factor": "Low Runway",
            "severity": "medium",
            "description": f"Runway decreases to {new_runway} days",
            "mitigation": "Monitor cash flow closely"
        })
    else:
        green_flags.append(f"Adequate runway ({new_runway} days)")
    
    # Check DTI
    if dti_ratio_new > DECISION_THRESHOLDS["critical_dti_ratio"]:
        risk_factors.append({
            "factor": "High DTI Ratio",
            "severity": "high",
            "description": f"DTI ratio ({dti_ratio_new:.1%}) exceeds recommended limits",
            "mitigation": "Consider lower payment option or debt reduction"
        })
    elif dti_ratio_new <= DECISION_THRESHOLDS["optimal_dti_ratio"]:
        green_flags.append(f"Optimal DTI ratio ({dti_ratio_new:.1%})")
    
    # Check stress tests
    stress_failures = sum(1 for s in stress_scenarios if s["risk_level"] in ["critical", "high"])
    stress_passes = len(stress_scenarios) - stress_failures
    
    if stress_failures >= 3:
        risk_factors.append({
            "factor": "Stress Test Failures",
            "severity": "high",
            "description": f"Failed {stress_failures} out of {len(stress_scenarios)} stress tests",
            "mitigation": "Build larger financial buffer before proceeding"
        })
    
    # Determine overall risk level
    if any(rf["severity"] == "critical" for rf in risk_factors):
        overall_risk = "high"
    elif any(rf["severity"] == "high" for rf in risk_factors):
        overall_risk = "medium"
    elif len(risk_factors) >= 2:
        overall_risk = "medium"
    else:
        overall_risk = "low"
    
    return {
        "overall_risk": overall_risk,
        "liquidity_adequate": liquidity_score >= DECISION_THRESHOLDS["low_liquidity_score"],
        "emergency_fund_safe": new_runway >= DECISION_THRESHOLDS["warning_runway_days"],
        "dti_within_limits": dti_ratio_new <= DECISION_THRESHOLDS["critical_dti_ratio"],
        "runway_acceptable": new_runway >= DECISION_THRESHOLDS["warning_runway_days"],
        "stress_tests_passed": stress_passes,
        "stress_tests_failed": stress_failures,
        "risk_factors": risk_factors,
        "green_flags": green_flags
    }

