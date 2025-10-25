"""
Database Persistence Tools

Utility functions for persisting transaction analysis results to Supabase.
Handles updates to transactions, insights, alerts, and agent_runs tables.
"""

from typing import Dict, Any, List, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from ...config import get_supabase_client, TABLES

# Thread pool for parallel database writes
_db_write_executor = ThreadPoolExecutor(max_workers=5)


def update_transaction_with_analysis(
    transaction_id: str, 
    analysis_results: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Update transaction record with analysis results.
    
    Args:
        transaction_id: UUID of the transaction to update
        analysis_results: Dictionary containing analysis results
        
    Returns:
        Dict with status and updated transaction data
    """
    try:
        supabase = get_supabase_client()
        
        # Extract analysis data
        categorization = analysis_results.get("categorization_result", {})
        fraud = analysis_results.get("fraud_result", {})
        
        # Prepare update data
        update_data = {}
        
        # Categorization results
        if categorization.get("status") == "success":
            update_data.update({
                "category": categorization.get("category"),
                "subcategory": categorization.get("subcategory"),
                "category_confidence": categorization.get("confidence"),
                "category_reason": categorization.get("reason")
            })
        
        # Fraud detection results
        if fraud.get("status") == "success":
            update_data["fraud_score"] = fraud.get("fraud_score")
        
        # Only update if we have data
        if not update_data:
            return {
                "status": "success",
                "message": "No analysis data to update",
                "updated": False
            }
        
        # Perform update
        result = supabase.table(TABLES["transactions"])\
            .update(update_data)\
            .eq("id", transaction_id)\
            .execute()
        
        if result.data:
            return {
                "status": "success",
                "message": "Transaction updated successfully",
                "updated": True,
                "data": result.data[0]
            }
        else:
            return {
                "status": "error",
                "error": "No data returned from update",
                "updated": False
            }
            
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "updated": False
        }


def create_insight_record(
    user_id: str,
    run_id: str,
    final_insight: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Create insight record in the database.
    
    Args:
        user_id: User UUID
        run_id: Agent run UUID
        final_insight: Final insight data from synthesizer
        
    Returns:
        Dict with status and insight_id
    """
    try:
        supabase = get_supabase_client()
        
        # Prepare insight data
        insight_data = {
            "user_id": user_id,
            "run_id": run_id,
            "title": final_insight.get("title", "Transaction Analysis"),
            "body": final_insight.get("body", ""),
            "data": final_insight.get("data", {}),
            "severity": final_insight.get("severity", "info")
        }
        
        # Insert insight
        result = supabase.table(TABLES["insights"])\
            .insert(insight_data)\
            .execute()
        
        if result.data:
            return {
                "status": "success",
                "insight_id": result.data[0]["id"],
                "message": "Insight created successfully"
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


def create_alerts_from_analysis(
    user_id: str,
    transaction_id: str,
    analysis_results: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Create alert records based on analysis results.
    
    Args:
        user_id: User UUID
        transaction_id: Transaction UUID
        analysis_results: Analysis results from all agents
        
    Returns:
        Dict with status and created alerts
    """
    try:
        supabase = get_supabase_client()
        alerts_created = []
        
        # Fraud alerts
        fraud_result = analysis_results.get("fraud_result", {})
        if fraud_result.get("status") == "success" and fraud_result.get("fraud_score", 0) > 0.5:
            alert_data = {
                "user_id": user_id,
                "tx_id": transaction_id,
                "type": "fraud",
                "score": fraud_result.get("fraud_score"),
                "reason": fraud_result.get("reason", "High fraud risk detected"),
                "severity": "high" if fraud_result.get("fraud_score", 0) > 0.8 else "medium",
                "status": "active"
            }
            
            result = supabase.table(TABLES["alerts"])\
                .insert(alert_data)\
                .execute()
            
            if result.data:
                alerts_created.append({
                    "type": "fraud",
                    "id": result.data[0]["id"],
                    "severity": alert_data["severity"]
                })
        
        # Budget alerts
        budget_result = analysis_results.get("budget_result", {})
        if budget_result.get("status") == "success" and budget_result.get("over_budget", False):
            alert_data = {
                "user_id": user_id,
                "tx_id": transaction_id,
                "type": "budget",
                "score": budget_result.get("budget_percentage", 0) / 100,
                "reason": budget_result.get("alert", "Transaction exceeds budget limit"),
                "severity": "medium",
                "status": "active"
            }
            
            result = supabase.table(TABLES["alerts"])\
                .insert(alert_data)\
                .execute()
            
            if result.data:
                alerts_created.append({
                    "type": "budget",
                    "id": result.data[0]["id"],
                    "severity": "medium"
                })
        
        # Cashflow alerts
        cashflow_result = analysis_results.get("cashflow_result", {})
        if cashflow_result.get("status") == "success" and cashflow_result.get("low_balance_alert", False):
            alert_data = {
                "user_id": user_id,
                "tx_id": transaction_id,
                "type": "cashflow",
                "score": 1.0 - (cashflow_result.get("runway_days", 0) / 30),  # Normalize to 0-1
                "reason": cashflow_result.get("recommendations", ["Low balance warning"])[0] if cashflow_result.get("recommendations") else "Low balance detected",
                "severity": cashflow_result.get("severity", "medium"),
                "status": "active"
            }
            
            result = supabase.table(TABLES["alerts"])\
                .insert(alert_data)\
                .execute()
            
            if result.data:
                alerts_created.append({
                    "type": "cashflow",
                    "id": result.data[0]["id"],
                    "severity": alert_data["severity"]
                })
        
        return {
            "status": "success",
            "alerts_created": alerts_created,
            "count": len(alerts_created)
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "alerts_created": []
        }


def update_agent_run_completion(
    run_id: str,
    timings: Dict[str, Any],
    status: str = "completed"
) -> Dict[str, Any]:
    """
    Update agent run record with completion status and timings.
    
    Args:
        run_id: Agent run UUID
        timings: Timing data from the pipeline
        status: Final status (completed, failed, etc.)
        
    Returns:
        Dict with status and update result
    """
    try:
        supabase = get_supabase_client()
        
        update_data = {
            "completed_at": datetime.now().isoformat(),
            "status": status,
            "timings": timings
        }
        
        result = supabase.table(TABLES["agent_runs"])\
            .update(update_data)\
            .eq("id", run_id)\
            .execute()
        
        if result.data:
            return {
                "status": "success",
                "message": "Agent run updated successfully",
                "data": result.data[0]
            }
        else:
            return {
                "status": "error",
                "error": "No data returned from update"
            }
            
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


def get_transaction_id_from_plaid_id(plaid_transaction_id: str) -> Optional[str]:
    """
    Get transaction UUID from Plaid transaction ID.
    
    Args:
        plaid_transaction_id: Plaid transaction ID
        
    Returns:
        Transaction UUID or None if not found
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table(TABLES["transactions"])\
            .select("id")\
            .eq("plaid_transaction_id", plaid_transaction_id)\
            .execute()
        
        if result.data:
            return result.data[0]["id"]
        return None
        
    except Exception as e:
        print(f"Error getting transaction ID: {e}")
        return None


def persist_analysis_results(
    user_id: str,
    run_id: str,
    plaid_transaction_id: str,
    analysis_results: Dict[str, Any],
    final_insight: Dict[str, Any],
    timings: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Main function to persist all analysis results to the database.
    Uses asyncio to run operations in parallel for maximum performance.
    
    Args:
        user_id: User UUID
        run_id: Agent run UUID
        plaid_transaction_id: Plaid transaction ID
        analysis_results: Results from all analysis agents
        final_insight: Final insight from synthesizer
        timings: Pipeline timing data
        
    Returns:
        Dict with comprehensive persistence results
    """
    try:
        results = {
            "status": "success",
            "transaction_updated": False,
            "insight_created": False,
            "alerts_created": [],
            "run_updated": False,
            "errors": []
        }
        
        # Get transaction ID
        transaction_id = get_transaction_id_from_plaid_id(plaid_transaction_id)
        if not transaction_id:
            results["errors"].append("Transaction not found in database")
            return results
        
        # Run all database operations in parallel using asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            tx_update, insight_result, alerts_result, run_update = loop.run_until_complete(
                asyncio.gather(
                    loop.run_in_executor(_db_write_executor, update_transaction_with_analysis, transaction_id, analysis_results),
                    loop.run_in_executor(_db_write_executor, create_insight_record, user_id, run_id, final_insight),
                    loop.run_in_executor(_db_write_executor, create_alerts_from_analysis, user_id, transaction_id, analysis_results),
                    loop.run_in_executor(_db_write_executor, update_agent_run_completion, run_id, timings),
                    return_exceptions=True
                )
            )
        finally:
            loop.close()
        
        # Process transaction update result
        if isinstance(tx_update, dict) and tx_update.get("status") == "success":
            results["transaction_updated"] = tx_update.get("updated", False)
        elif isinstance(tx_update, Exception):
            results["errors"].append(f"Transaction update failed: {str(tx_update)}")
        else:
            results["errors"].append(f"Transaction update failed: {tx_update.get('error', 'Unknown error')}")
        
        # Process insight creation result
        if isinstance(insight_result, dict) and insight_result.get("status") == "success":
            results["insight_created"] = True
            results["insight_id"] = insight_result.get("insight_id")
        elif isinstance(insight_result, Exception):
            results["errors"].append(f"Insight creation failed: {str(insight_result)}")
        else:
            results["errors"].append(f"Insight creation failed: {insight_result.get('error', 'Unknown error')}")
        
        # Process alerts result
        if isinstance(alerts_result, dict) and alerts_result.get("status") == "success":
            results["alerts_created"] = alerts_result.get("alerts_created", [])
        elif isinstance(alerts_result, Exception):
            results["errors"].append(f"Alert creation failed: {str(alerts_result)}")
        else:
            results["errors"].append(f"Alert creation failed: {alerts_result.get('error', 'Unknown error')}")
        
        # Process agent run update
        if isinstance(run_update, dict) and run_update.get("status") == "success":
            results["run_updated"] = True
        elif isinstance(run_update, Exception):
            results["errors"].append(f"Run update failed: {str(run_update)}")
        else:
            results["errors"].append(f"Run update failed: {run_update.get('error', 'Unknown error')}")
        
        # Determine overall status
        if results["errors"]:
            results["status"] = "partial_success" if any([
                results["transaction_updated"],
                results["insight_created"],
                results["run_updated"]
            ]) else "failed"
        
        return results
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "transaction_updated": False,
            "insight_created": False,
            "alerts_created": [],
            "run_updated": False,
            "errors": [str(e)]
        }
