"""
Credit Impact Tools

Simulates credit score impact of financial decisions.
"""

from typing import Dict, Any, List


def estimate_credit_impact(
    decision_type: str,
    option_details: Dict[str, Any],
    user_profile: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Estimate credit score impact of a financial decision
    
    Args:
        decision_type: Type of decision (car_lease_vs_finance, etc.)
        option_details: Details of the specific option
        user_profile: User's financial profile
    
    Returns:
        Dict with credit impact analysis
    """
    impacts = []
    score_delta_min = 0
    score_delta_max = 0
    
    # Decision types that involve credit applications
    if decision_type in ["car_lease_vs_finance", "car_lease_vs_buy", "mortgage_vs_rent"]:
        # Hard inquiry impact (always present for financing)
        impacts.append({
            "factor": "Hard Inquiry",
            "impact": "-5 to -10 points",
            "duration": "6-12 months",
            "description": "Credit application creates hard pull on your credit report"
        })
        score_delta_min -= 10
        score_delta_max -= 5
        
        # New credit account impact
        impacts.append({
            "factor": "Average Age of Accounts",
            "impact": "-3 to -8 points",
            "duration": "6-12 months",
            "description": "New account lowers your average account age"
        })
        score_delta_min -= 8
        score_delta_max -= 3
        
        # Installment mix benefit (positive for financing)
        option_type = option_details.get("option_type", "")
        if "finance" in option_type.lower() or "mortgage" in decision_type:
            impacts.append({
                "factor": "Credit Mix",
                "impact": "+2 to +5 points",
                "duration": "Ongoing",
                "description": "Installment loan improves your credit mix diversity"
            })
            score_delta_min += 2
            score_delta_max += 5
        
        # Utilization impact (if using credit for down payment)
        down_payment = option_details.get("tco_breakdown", {}).get("down_payment", 0)
        total_credit_limit = user_profile.get("total_credit_limit", 10000)
        
        if down_payment > 0 and total_credit_limit > 0:
            # Assume 50% chance of using credit for down payment
            utilization_increase = (down_payment / total_credit_limit)
            
            if utilization_increase > 0.1:  # More than 10% increase
                impacts.append({
                    "factor": "Credit Utilization",
                    "impact": "-15 to -30 points",
                    "duration": "Until paid off",
                    "description": f"If using credit for down payment, utilization could increase by ~{utilization_increase*100:.1f}%"
                })
                # Don't apply this to overall score by default (it's conditional)
                # Just list it as a potential impact
        
        # On-time payment benefit (long-term positive)
        impacts.append({
            "factor": "Payment History",
            "impact": "+5 to +15 points",
            "duration": "Long-term (12+ months)",
            "description": "Consistent on-time payments will gradually improve your score"
        })
    
    # Calculate recovery timeline based on severity
    abs_min_delta = abs(score_delta_min)
    if abs_min_delta < 15:
        recovery_months = 6
        severity = "low"
    elif abs_min_delta < 25:
        recovery_months = 9
        severity = "medium"
    else:
        recovery_months = 12
        severity = "high"
    
    # Format impact range
    impact_range = f"{score_delta_min} to {score_delta_max} points"
    
    return {
        "estimated_impact_range": impact_range,
        "score_delta_min": score_delta_min,
        "score_delta_max": score_delta_max,
        "impact_factors": impacts,
        "recovery_timeline_months": recovery_months,
        "severity": severity,
        "notes": [
            "Actual impact varies by credit history and profile",
            "Short-term dip is normal and expected",
            "Long-term benefit from on-time payments outweighs initial impact"
        ]
    }


def simulate_credit_scenarios(
    base_score: int,
    impact_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Simulate credit score trajectories over time
    
    Args:
        base_score: User's current credit score
        impact_analysis: Output from estimate_credit_impact
    
    Returns:
        Dict with score projections
    """
    score_delta_min = impact_analysis["score_delta_min"]
    score_delta_max = impact_analysis["score_delta_max"]
    recovery_months = impact_analysis["recovery_timeline_months"]
    
    # Initial impact (month 0)
    min_score = base_score + score_delta_min
    max_score = base_score + score_delta_max
    
    # Recovery trajectory (linear for simplicity)
    trajectory_min = []
    trajectory_max = []
    
    # Month 0: Initial impact
    trajectory_min.append({"month": 0, "score": min_score})
    trajectory_max.append({"month": 0, "score": max_score})
    
    # Recovery over time (back to base + long-term benefit)
    long_term_benefit = 10  # Average benefit from on-time payments
    
    for month in range(1, recovery_months + 7):
        if month <= recovery_months:
            # Recovering toward base
            progress = month / recovery_months
            score_min = min_score + (abs(score_delta_min) * progress)
            score_max = max_score + (abs(score_delta_max) * progress)
        else:
            # Adding long-term benefit
            months_beyond = month - recovery_months
            benefit_progress = min(1.0, months_beyond / 6)
            score_min = base_score + (long_term_benefit * benefit_progress)
            score_max = base_score + (long_term_benefit * benefit_progress)
        
        trajectory_min.append({"month": month, "score": int(score_min)})
        trajectory_max.append({"month": month, "score": int(score_max)})
    
    return {
        "base_score": base_score,
        "initial_score_min": min_score,
        "initial_score_max": max_score,
        "projected_12mo_min": trajectory_min[-1]["score"],
        "projected_12mo_max": trajectory_max[-1]["score"],
        "trajectory_pessimistic": trajectory_min,
        "trajectory_optimistic": trajectory_max
    }

