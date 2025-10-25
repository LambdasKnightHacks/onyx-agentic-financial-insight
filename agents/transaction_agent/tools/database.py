"""Database operations for transaction analysis."""

from typing import Dict, Any
from ..config import get_supabase_client, TABLES

def check_transaction_exists(plaid_transaction_id: str) -> Dict[str, Any]:
    """
    Check if a transaction with the given Plaid ID already exists.
    
    Args:
        plaid_transaction_id: The Plaid transaction ID to check
        
    Returns:
        Dict with status and exists boolean
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table(TABLES["transactions"])\
            .select("id")\
            .eq("plaid_transaction_id", plaid_transaction_id)\
            .execute()
        
        return {
            "status": "success",
            "exists": len(result.data) > 0,
            "transaction_id": result.data[0]["id"] if result.data else None
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "exists": False
        }

def create_agent_run(run_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new agent run record.
    
    Args:
        run_data: Dictionary with run information
        
    Returns:
        Dict with status and run_id
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table(TABLES["agent_runs"])\
            .insert(run_data)\
            .execute()
        
        if result.data:
            return {
                "status": "success",
                "run_id": result.data[0]["id"]
            }
        else:
            return {
                "status": "error",
                "error": "No data returned from insert"
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

def fetch_user_category_rules(user_id: str) -> Dict[str, Any]:
    """
    Fetch user's custom category rules.
    
    Args:
        user_id: User UUID
        
    Returns:
        Dict with status and rules data
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table(TABLES["category_rules"])\
            .select("*")\
            .eq("user_id", user_id)\
            .order("priority")\
            .execute()
        
        return {
            "status": "success",
            "data": result.data
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "data": []
        }

def fetch_user_recent_transactions(user_id: str, days: int = 30) -> Dict[str, Any]:
    """
    Fetch user's recent transactions for baseline analysis.
    
    Args:
        user_id: User UUID
        days: Number of days to look back
        
    Returns:
        Dict with status and transactions data
    """
    try:
        supabase = get_supabase_client()
        
        # Calculate date threshold
        from datetime import datetime, timedelta
        threshold_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        result = supabase.table(TABLES["transactions"])\
            .select("amount, posted_at, merchant_name, category, location_city, location_state")\
            .eq("user_id", user_id)\
            .gte("posted_at", threshold_date)\
            .order("posted_at", desc=True)\
            .execute()
        
        return {
            "status": "success",
            "data": result.data
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "data": []
        }

def fetch_user_accounts(user_id: str) -> Dict[str, Any]:
    """
    Fetch user's accounts for cashflow analysis.
    
    Args:
        user_id: User UUID
        
    Returns:
        Dict with status and accounts data
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table(TABLES["accounts"])\
            .select("*")\
            .eq("user_id", user_id)\
            .execute()
        
        return {
            "status": "success",
            "data": result.data
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "data": []
        }