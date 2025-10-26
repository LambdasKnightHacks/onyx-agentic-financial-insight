"""
Database operations for decision analysis system

Handles all CRUD operations for decision analyses, options,
recommendations, and related data.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from ..config import get_supabase_client


async def create_decision_analysis(
    user_id: str,
    session_id: str,
    decision_type: str,
    input_data: Dict[str, Any]
) -> str:
    """
    Create a new decision analysis record
    
    Returns:
        analysis_id (UUID)
    """
    supabase = get_supabase_client()
    
    result = supabase.table("decision_analyses").insert({
        "user_id": user_id,
        "session_id": session_id,
        "decision_type": decision_type,
        "input_data": input_data,
        "status": "processing",
        "started_at": datetime.now().isoformat()
    }).execute()
    
    return result.data[0]["id"]


async def update_decision_analysis(
    analysis_id: str,
    status: Optional[str] = None,
    output_data: Optional[Dict[str, Any]] = None,
    processing_time_seconds: Optional[float] = None
) -> bool:
    """
    Update decision analysis record with results
    
    Returns:
        True if successful
    """
    supabase = get_supabase_client()
    
    update_data = {}
    
    if status:
        update_data["status"] = status
    
    if output_data:
        update_data["output_data"] = output_data
    
    if processing_time_seconds:
        update_data["processing_time_seconds"] = processing_time_seconds
    
    if status == "completed":
        update_data["completed_at"] = datetime.now().isoformat()
    
    supabase.table("decision_analyses").update(update_data).eq("id", analysis_id).execute()
    
    return True


async def save_decision_options(
    analysis_id: str,
    options: List[Dict[str, Any]]
) -> List[str]:
    """
    Save decision options to database
    
    Returns:
        List of option IDs
    """
    supabase = get_supabase_client()
    
    option_ids = []
    
    for option in options:
        result = supabase.table("decision_options").insert({
            "analysis_id": analysis_id,
            "option_name": option.get("name"),
            "option_type": option.get("option_type"),
            "tco_expected": option.get("tco_expected"),
            "tco_range": option.get("tco_range"),
            "monthly_payment": option.get("monthly_payment"),
            "upfront_cost": option.get("upfront_cost"),
            "liquidity_score": option.get("liquidity_score"),
            "credit_impact": option.get("credit_impact"),
            "runway_breach_probability": option.get("runway_breach_prob_6mo"),
            "utility_score": option.get("utility_score"),
            "metadata": {
                "pros": option.get("pros", []),
                "cons": option.get("cons", []),
                "tco_breakdown": option.get("tco_breakdown", {}),
                "runway_impact": option.get("runway_impact", {}),
                "credit_impact_details": option.get("credit_impact_details", {})
            }
        }).execute()
        
        option_ids.append(result.data[0]["id"])
    
    return option_ids


async def save_decision_recommendations(
    analysis_id: str,
    recommendations: List[Dict[str, Any]]
) -> List[str]:
    """
    Save budget rebalancing recommendations
    
    Returns:
        List of recommendation IDs
    """
    supabase = get_supabase_client()
    
    recommendation_ids = []
    
    for rec in recommendations:
        result = supabase.table("decision_recommendations").insert({
            "analysis_id": analysis_id,
            "recommendation_type": "budget_cut",  # Default type
            "category": rec.get("category"),
            "subcategory": rec.get("subcategory"),
            "current_value": rec.get("current_monthly"),
            "suggested_value": rec.get("suggested_monthly"),
            "monthly_impact": rec.get("monthly_savings"),
            "reasoning": f"{rec.get('specific_change')} - {rec.get('behavioral_tip')}",
            "priority": 100 - int(rec.get("monthly_savings", 0))  # Higher savings = higher priority
        }).execute()
        
        recommendation_ids.append(result.data[0]["id"])
    
    return recommendation_ids


async def save_stress_scenarios(
    analysis_id: str,
    scenarios: List[Dict[str, Any]]
) -> List[str]:
    """
    Save stress test scenario results
    
    Returns:
        List of scenario IDs
    """
    supabase = get_supabase_client()
    
    scenario_ids = []
    
    for scenario in scenarios:
        result = supabase.table("decision_scenarios").insert({
            "analysis_id": analysis_id,
            "scenario_name": scenario.get("name"),
            "scenario_type": scenario.get("type"),
            "parameters": scenario.get("parameters", {}),
            "impact": scenario.get("impact", {}),
            "risk_level": scenario.get("risk_level")
        }).execute()
        
        scenario_ids.append(result.data[0]["id"])
    
    return scenario_ids


async def track_agent_execution(
    analysis_id: str,
    agent_name: str,
    status: str,
    output: Optional[Dict[str, Any]] = None,
    error_message: Optional[str] = None,
    processing_time_ms: Optional[int] = None
) -> str:
    """
    Track individual agent execution for performance monitoring
    
    Returns:
        agent_run_id
    """
    supabase = get_supabase_client()
    
    result = supabase.table("decision_agent_runs").insert({
        "analysis_id": analysis_id,
        "agent_name": agent_name,
        "status": status,
        "output": output,
        "error_message": error_message,
        "processing_time_ms": processing_time_ms,
        "completed_at": datetime.now().isoformat() if status in ["completed", "failed"] else None
    }).execute()
    
    return result.data[0]["id"]


async def get_decision_analysis(analysis_id: str) -> Optional[Dict[str, Any]]:
    """Get decision analysis by ID"""
    supabase = get_supabase_client()
    
    result = supabase.table("decision_analyses").select("*").eq("id", analysis_id).execute()
    
    return result.data[0] if result.data else None


async def get_user_decision_history(user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Get user's past decision analyses"""
    supabase = get_supabase_client()
    
    result = supabase.table("decision_analyses").select(
        "id, decision_type, status, created_at, output_data, processing_time_seconds"
    ).eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
    
    return result.data


async def update_decision_analysis_status(
    analysis_id: str,
    status: str,
    output_data: Optional[Dict[str, Any]] = None,
    processing_time_seconds: Optional[float] = None,
    error_message: Optional[str] = None
) -> bool:
    """
    Update decision analysis status (wrapper for update_decision_analysis)
    
    Args:
        analysis_id: Analysis UUID
        status: New status ('processing', 'completed', 'failed')
        output_data: Optional output data
        processing_time_seconds: Optional processing time
        error_message: Optional error message for failed status
    
    Returns:
        True if successful
    """
    supabase = get_supabase_client()
    
    update_data = {
        "status": status,
        "completed_at": datetime.now().isoformat() if status in ["completed", "failed"] else None
    }
    
    if output_data:
        update_data["output_data"] = output_data
    
    if processing_time_seconds:
        update_data["processing_time_seconds"] = processing_time_seconds
    
    if error_message:
        update_data["error_message"] = error_message
    
    try:
        supabase.table("decision_analyses").update(update_data).eq("id", analysis_id).execute()
        return True
    except Exception as e:
        print(f"Failed to update decision analysis status: {e}")
        return False


async def create_agent_run_record(analysis_id: str, agent_name: str) -> Optional[str]:
    """
    Create agent run tracking record
    
    Args:
        analysis_id: Decision analysis UUID
        agent_name: Name of the agent
    
    Returns:
        Agent run ID or None if failed
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("decision_agent_runs").insert({
            "analysis_id": analysis_id,
            "agent_name": agent_name,
            "started_at": datetime.now().isoformat(),
            "status": "running"
        }).execute()
        
        return result.data[0]["id"] if result.data else None
    except Exception as e:
        print(f"Failed to create agent run record: {e}")
        return None


async def update_agent_run_status(
    analysis_id: str,
    agent_name: str,
    status: str,
    output: Optional[Dict[str, Any]] = None,
    processing_time_ms: Optional[int] = None,
    error_message: Optional[str] = None
) -> bool:
    """
    Update agent run status
    
    Args:
        analysis_id: Decision analysis UUID
        agent_name: Name of the agent
        status: New status ('running', 'completed', 'failed')
        output: Optional agent output
        processing_time_ms: Optional processing time in milliseconds
        error_message: Optional error message
    
    Returns:
        True if successful
    """
    supabase = get_supabase_client()
    
    update_data = {
        "status": status,
        "completed_at": datetime.now().isoformat() if status in ["completed", "failed"] else None
    }
    
    if output:
        update_data["output"] = output
    
    if processing_time_ms:
        update_data["processing_time_ms"] = processing_time_ms
    
    if error_message:
        update_data["error_message"] = error_message
    
    try:
        supabase.table("decision_agent_runs").update(update_data).eq(
            "analysis_id", analysis_id
        ).eq("agent_name", agent_name).execute()
        return True
    except Exception as e:
        print(f"Failed to update agent run status: {e}")
        return False


async def apply_recommendation(recommendation_id: str, user_id: str) -> Dict[str, Any]:
    """
    Mark a recommendation as applied and optionally create actual budget
    
    Returns:
        Dict with status and details
    """
    supabase = get_supabase_client()
    
    # Get recommendation details
    rec_result = supabase.table("decision_recommendations").select("*").eq(
        "id", recommendation_id
    ).execute()
    
    if not rec_result.data:
        return {"success": False, "error": "Recommendation not found"}
    
    rec = rec_result.data[0]
    
    # Mark as applied
    supabase.table("decision_recommendations").update({
        "is_applied": True,
        "applied_at": datetime.now().isoformat()
    }).eq("id", recommendation_id).execute()
    
    # Optionally create budget entry
    if rec["recommendation_type"] == "budget_cut" and rec.get("suggested_value"):
        supabase.table("budgets").insert({
            "user_id": user_id,
            "category": rec["category"],
            "subcategory": rec.get("subcategory"),
            "cap_amount": rec["suggested_value"],
            "period": "month",
            "is_active": True
        }).execute()
    
    return {
        "success": True,
        "message": "Recommendation applied successfully",
        "category": rec["category"],
        "monthly_savings": rec["monthly_impact"]
    }

