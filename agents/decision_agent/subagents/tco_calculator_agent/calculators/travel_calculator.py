"""
Travel TCO Calculator

Calculates optimal travel timing based on costs, budget impact, and opportunity cost.
Helps users decide when to book trips based on financial situation.
"""

from typing import Dict, Any
from datetime import datetime, timedelta


def calculate_travel_tco(
    option_type: str,
    params: Dict[str, Any],
    tenure_months: int = 1
) -> Dict[str, Any]:
    """
    Calculate travel cost analysis for different timing options
    
    Args:
        option_type: "book_now" or "book_later"
        params: Dictionary with travel parameters
        tenure_months: Not really used for travel (kept for consistency)
    
    Returns:
        Complete cost breakdown and timing analysis
    """
    
    trip_cost = params.get("trip_cost", 0)
    flight_cost = params.get("flight_cost", 0)
    hotel_cost = params.get("hotel_cost", 0)
    other_costs = params.get("other_costs", 0)
    
    if option_type == "book_now":
        price_volatility = params.get("price_volatility", 0.10)  # 10% potential increase
        booking_fees = params.get("booking_fees", 50)
        
        total_cost = trip_cost + booking_fees
        
        # Price range based on volatility
        min_cost = total_cost * (1 - price_volatility)
        max_cost = total_cost * (1 + price_volatility)
        
        return {
            "option_type": "book_now",
            "tco_expected": round(total_cost, 2),
            "tco_range": [round(min_cost, 2), round(max_cost, 2)],
            "tco_breakdown": {
                "flight": round(flight_cost, 2),
                "hotel": round(hotel_cost, 2),
                "other": round(other_costs, 2),
                "booking_fees": round(booking_fees, 2)
            },
            "monthly_equivalent": round(total_cost, 2),
            "residual_value": 0
        }
    
    elif option_type == "book_later":
        months_to_wait = params.get("months_to_wait", 3)
        expected_price_change = params.get("expected_price_change", 0.15)  # 15% increase if waiting
        opportunity_savings = params.get("opportunity_savings_per_month", 200) * months_to_wait
        
        future_trip_cost = trip_cost * (1 + expected_price_change)
        total_cost = future_trip_cost
        
        # Account for additional savings accumulated
        net_cost = total_cost - opportunity_savings
        
        return {
            "option_type": "book_later",
            "tco_expected": round(net_cost, 2),
            "tco_range": [round(net_cost * 0.90, 2), round(net_cost * 1.10, 2)],
            "tco_breakdown": {
                "future_trip_cost": round(future_trip_cost, 2),
                "additional_savings": round(-opportunity_savings, 2)
            },
            "monthly_equivalent": round(net_cost, 2),
            "residual_value": 0,
            "months_to_wait": months_to_wait
        }
    
    else:
        raise ValueError(f"Invalid option_type: {option_type}")

