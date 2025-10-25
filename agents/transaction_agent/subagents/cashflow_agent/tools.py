from typing import Dict, Any

def calculate_runway_days(current_balance: float, avg_daily_spend: float) -> Dict[str, Any]:
    """
    Calculate days until balance reaches zero.
    
    Args:
        current_balance: Current account balance
        avg_daily_spend: Average daily spending amount
        
    Returns:
        Dict with runway analysis
    """
    if avg_daily_spend <= 0:
        return {
            "status": "no_spending",
            "runway_days": 999,
            "severity": "info"
        }
    
    runway_days = int(current_balance / avg_daily_spend)
    
    return {
        "status": "success",
        "runway_days": runway_days,
        "severity": "critical" if runway_days < 7 else "warn" if runway_days < 30 else "info",
        "daily_burn_rate": avg_daily_spend
    }

def forecast_balance(current_balance: float, avg_daily_spend: float, days: int) -> Dict[str, Any]:
    """
    Forecast balance after N days.
    
    Args:
        current_balance: Current balance
        avg_daily_spend: Average daily spending
        days: Number of days to forecast
        
    Returns:
        Dict with forecasted balance
    """
    forecasted_balance = current_balance - (avg_daily_spend * days)
    confidence = 0.9 if days <= 7 else 0.7 if days <= 30 else 0.5
    
    return {
        "status": "success",
        "days": days,
        "forecasted_balance": round(forecasted_balance, 2),
        "confidence": confidence,
        "will_overdraft": forecasted_balance < 0
    }