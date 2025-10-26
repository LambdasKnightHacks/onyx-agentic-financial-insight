"""Financial Summary Storage

Handles database operations for financial summaries:
- Store generated summaries
- Retrieve latest summaries
- Check if regeneration is needed
"""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from .config import get_supabase_client


async def store_summary(user_id: str, summary_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Store a financial summary in the database.
    
    Args:
        user_id: User UUID
        summary_data: Complete summary dictionary from generator
    
    Returns:
        Dict with success status and summary_id
    """
    try:
        supabase = get_supabase_client()
        
        # Extract period info from summary
        period = summary_data.get("period", {})
        
        # Prepare data for insertion
        insert_data = {
            "user_id": user_id,
            "period_days": period.get("days", 30),
            "period_start": period.get("start_date"),
            "period_end": period.get("end_date"),
            
            # Financial overview metrics
            "total_income": summary_data.get("financial_overview", {}).get("total_income"),
            "total_expenses": summary_data.get("financial_overview", {}).get("total_expenses"),
            "net_flow": summary_data.get("financial_overview", {}).get("net_flow"),
            
            # Summary components (stored as JSONB)
            "top_categories": summary_data.get("spending_breakdown", {}).get("top_categories"),
            "spending_trends": summary_data.get("spending_trends"),
            "budget_progress": summary_data.get("budget_progress"),
            "risks": summary_data.get("risks"),
            "next_actions": summary_data.get("next_best_actions"),
            "micro_lesson": summary_data.get("micro_lesson"),
            "wins": summary_data.get("wins"),
            "balance_info": summary_data.get("balance"),
            
            # Complete summary data
            "summary_data": summary_data
        }
        
        # Try to insert (will fail if unique constraint exists - same user, period_start, period_end)
        result = supabase.table("financial_summaries").insert(insert_data).execute()
        
        if result.data:
            return {
                "success": True,
                "summary_id": result.data[0]["id"],
                "message": "Summary stored successfully"
            }
        else:
            return {
                "success": False,
                "error": "No data returned from insert"
            }
            
    except Exception as e:
        # Check if it's a unique constraint violation (already exists)
        error_str = str(e)
        if "unique" in error_str.lower() or "duplicate" in error_str.lower():
            return {
                "success": False,
                "error": "Summary already exists for this period",
                "already_exists": True
            }
        
        return {
            "success": False,
            "error": str(e),
            "already_exists": False
        }


async def get_latest_summary(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get the most recent financial summary for a user.
    
    Args:
        user_id: User UUID
    
    Returns:
        Latest summary dict or None if not found
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("financial_summaries")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        
        return None
        
    except Exception as e:
        print(f"Error fetching latest summary: {e}")
        return None


async def should_regenerate_summary(user_id: str, max_age_hours: int = 6) -> bool:
    """
    Check if a summary should be regenerated based on age.
    
    Args:
        user_id: User UUID
        max_age_hours: Maximum age in hours before regeneration (default 6)
    
    Returns:
        True if summary should be regenerated, False if fresh enough
    """
    summary = await get_latest_summary(user_id)
    
    if not summary:
        # No summary exists, should generate
        return True
    
    # Check age of latest summary
    created_at_str = summary.get("created_at")
    if not created_at_str:
        return True
    
    try:
        created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
        age = datetime.now(created_at.tzinfo) - created_at
        age_hours = age.total_seconds() / 3600
        
        # Should regenerate if older than max_age_hours
        return age_hours > max_age_hours
        
    except Exception as e:
        print(f"Error checking summary age: {e}")
        return True


async def get_summary_by_period(user_id: str, period_start: str, period_end: str) -> Optional[Dict[str, Any]]:
    """
    Get a specific summary by period.
    
    Args:
        user_id: User UUID
        period_start: Start date (YYYY-MM-DD)
        period_end: End date (YYYY-MM-DD)
    
    Returns:
        Summary dict or None if not found
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("financial_summaries")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("period_start", period_start)\
            .eq("period_end", period_end)\
            .execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        
        return None
        
    except Exception as e:
        print(f"Error fetching summary by period: {e}")
        return None
