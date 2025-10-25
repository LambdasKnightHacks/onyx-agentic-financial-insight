"""Database operations for transaction analysis."""

from typing import Dict, Any, List, Tuple
import asyncio
from concurrent.futures import ThreadPoolExecutor
from ..config import (
    get_supabase_client, 
    TABLES,
    get_cached_user_context,
    set_cached_user_context
)

# Thread pool for parallel database operations
_db_executor = ThreadPoolExecutor(max_workers=10)

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

async def fetch_user_context_parallel(user_id: str, days: int = 30) -> Dict[str, Any]:
    """
    Fetch all user context data in parallel with caching for maximum performance.
    
    Args:
        user_id: User UUID
        days: Number of days for transaction history
        
    Returns:
        Dict with all context data
    """
    # Check cache first
    cached_data = get_cached_user_context(user_id)
    if cached_data:
        return cached_data
    
    loop = asyncio.get_event_loop()
    
    # Run all database queries in parallel using thread pool
    category_rules_task = loop.run_in_executor(_db_executor, fetch_user_category_rules, user_id)
    recent_txns_task = loop.run_in_executor(_db_executor, fetch_user_recent_transactions, user_id, days)
    accounts_task = loop.run_in_executor(_db_executor, fetch_user_accounts, user_id)
    
    # Wait for all queries to complete
    category_rules_result, recent_txns_result, accounts_result = await asyncio.gather(
        category_rules_task,
        recent_txns_task,
        accounts_task,
        return_exceptions=True
    )
    
    # Extract data with error handling
    user_rules = category_rules_result.get("data", []) if isinstance(category_rules_result, dict) and category_rules_result.get("status") == "success" else []
    baseline_transactions = recent_txns_result.get("data", []) if isinstance(recent_txns_result, dict) and recent_txns_result.get("status") == "success" else []
    user_accounts = accounts_result.get("data", []) if isinstance(accounts_result, dict) and accounts_result.get("status") == "success" else []
    
    # Calculate baseline stats
    total_baseline_amount = sum(float(tx.get("amount", 0)) for tx in baseline_transactions)
    avg_daily_spend = total_baseline_amount / days if baseline_transactions else 0
    
    result = {
        "user_rules": user_rules,
        "baseline_transactions": baseline_transactions,
        "user_accounts": user_accounts,
        "baseline_stats": {
            "total_amount_30d": total_baseline_amount,
            "avg_daily_spend": avg_daily_spend,
            "transaction_count": len(baseline_transactions)
        }
    }
    
    # Cache the result
    set_cached_user_context(user_id, result)
    
    return result

async def check_transaction_exists_async(plaid_transaction_id: str) -> Dict[str, Any]:
    """Async version of check_transaction_exists."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_db_executor, check_transaction_exists, plaid_transaction_id)

async def create_agent_run_async(run_data: Dict[str, Any]) -> Dict[str, Any]:
    """Async version of create_agent_run."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_db_executor, create_agent_run, run_data)