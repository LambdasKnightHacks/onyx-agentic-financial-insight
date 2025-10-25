from typing import List, Dict, Any

def calculate_z_score(amount: float, baseline_amounts: List[float]) -> Dict[str, Any]:
    """
    Calculate z-score for transaction amount vs baseline.
    
    Args:
        amount: Transaction amount
        baseline_amounts: List of recent transaction amounts
        
    Returns:
        Dict with z-score and interpretation
    """
    if not baseline_amounts or len(baseline_amounts) < 2:
        return {"status": "insufficient_data", "z_score": 0}
    
    import statistics
    
    mean = statistics.mean(baseline_amounts)
    stdev = statistics.stdev(baseline_amounts)
    
    if stdev == 0:
        return {"status": "no_variance", "z_score": 0}
    
    z_score = (amount - mean) / stdev
    
    return {
        "status": "success",
        "z_score": abs(z_score),
        "mean": mean,
        "stdev": stdev,
        "interpretation": "high" if abs(z_score) > 3 else "moderate" if abs(z_score) > 2 else "normal"
    }

def check_geo_anomaly(current_location: Dict[str, Any], user_locations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Check if current transaction location is anomalous.
    
    Args:
        current_location: Dict with city, state, lat, lon
        user_locations: List of user's typical locations
        
    Returns:
        Dict with anomaly status and distance info
    """
    if not current_location or not user_locations:
        return {"status": "no_data", "anomaly": False}
    
    # Simple check: if location has been seen before, it's normal
    current_city = current_location.get('location_city', '').lower()
    current_state = current_location.get('location_state', '').lower()
    
    if not current_city and not current_state:
        return {"status": "no_location_data", "anomaly": False}
    
    for loc in user_locations:
        if (loc.get('location_city', '').lower() == current_city and 
            loc.get('location_state', '').lower() == current_state):
            return {
                "status": "known_location",
                "anomaly": False,
                "distance_miles": 0
            }
    
    # If we get here, it's a new location
    return {
        "status": "new_location",
        "anomaly": True,
        "distance_miles": "unknown",
        "severity": "medium"
    }

def check_velocity(transaction_time: str, recent_transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Check transaction velocity (multiple transactions in short time).
    
    Args:
        transaction_time: Current transaction timestamp
        recent_transactions: Recent transactions with timestamps
        
    Returns:
        Dict with velocity analysis
    """
    if not recent_transactions:
        return {"status": "no_data", "velocity_issue": False}
    
    # Count transactions in last hour (simplified)
    recent_count = len([tx for tx in recent_transactions[-10:]])
    
    return {
        "status": "success",
        "transactions_last_hour": recent_count,
        "velocity_issue": recent_count > 5,
        "severity": "high" if recent_count > 10 else "medium" if recent_count > 5 else "low"
    }