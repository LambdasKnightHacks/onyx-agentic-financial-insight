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
    final_insight: Dict[str, Any],
    plaid_transaction_id: str = None
) -> Dict[str, Any]:
    """
    Create insight record in the database.
    
    Args:
        user_id: User UUID
        run_id: Agent run UUID
        final_insight: Final insight data from synthesizer
        plaid_transaction_id: Plaid transaction ID (optional, for creating alerts)
        
    Returns:
        Dict with status and insight_id
    """
    try:
        supabase = get_supabase_client()
        
        # Check if final_insight is valid
        if not final_insight or final_insight.get("error"):
            print(f"[DB] Skipping insight creation - invalid final_insight: {final_insight}")
            return {
                "status": "error",
                "error": "Invalid final_insight data"
            }
        
        # Prepare insight data
        severity = final_insight.get("severity", "info")
        insight_data = {
            "user_id": user_id,
            "run_id": run_id,
            "title": final_insight.get("title", "Transaction Analysis"),
            "body": final_insight.get("body", ""),
            "data": final_insight.get("data", {}),
            "severity": severity
        }
        
        print(f"[DB] Creating insight with data: {insight_data}")
        
        # Insert insight
        result = supabase.table(TABLES["insights"])\
            .insert(insight_data)\
            .execute()
        
        if result.data:
            print(f"[DB] Insight created successfully with ID: {result.data[0]['id']}")
            insight_id = result.data[0]["id"]
            
            # Check if severity is critical and create fraud alert
            if severity == "critical" and plaid_transaction_id:
                try:
                    # Get transaction_id from plaid_transaction_id
                    transaction_id = get_transaction_id_from_plaid_id(plaid_transaction_id)
                    
                    if transaction_id:
                        # Extract relevant data from final_insight
                        insight_data_dict = final_insight.get("data", {})
                        key_metrics = insight_data_dict.get("key_metrics", {})
                        risk_assessment = insight_data_dict.get("risk_assessment", {})
                        
                        # Get fraud score from key_metrics or risk_assessment
                        fraud_score = key_metrics.get("fraud_score", risk_assessment.get("risk_score", 0.85))
                        
                        # Get reason from insight body or title
                        reason = final_insight.get("body", final_insight.get("title", "Critical insight detected"))
                        
                        # Create fraud alert
                        alert_data = {
                            "user_id": user_id,
                            "tx_id": transaction_id,
                            "type": "fraud",
                            "score": float(fraud_score),
                            "reason": reason[:500] if len(reason) > 500 else reason,  # Limit reason length
                            "severity": "critical",
                            "status": "active"
                        }
                        
                        print(f"[DB] Creating critical alert for transaction_id: {transaction_id}")
                        alert_result = supabase.table(TABLES["alerts"])\
                            .insert(alert_data)\
                            .execute()
                        
                        if alert_result.data:
                            print(f"[DB] Alert created successfully with ID: {alert_result.data[0]['id']}")
                            return {
                                "status": "success",
                                "insight_id": insight_id,
                                "alert_id": alert_result.data[0]["id"],
                                "message": "Insight and critical alert created successfully"
                            }
                        else:
                            print(f"[DB] Alert creation failed - no data returned")
                    else:
                        print(f"[DB] Could not find transaction_id for plaid_transaction_id: {plaid_transaction_id}")
                except Exception as alert_error:
                    print(f"[DB] Error creating critical alert: {str(alert_error)}")
                    import traceback
                    traceback.print_exc()
            
            return {
                "status": "success",
                "insight_id": insight_id,
                "message": "Insight created successfully"
            }
        else:
            print(f"[DB] No data returned from insight insert")
            return {
                "status": "error",
                "error": "No data returned from insert"
            }
            
    except Exception as e:
        print(f"[DB] Error creating insight: {str(e)}")
        import traceback
        traceback.print_exc()
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
            fraud_score = fraud_result.get("fraud_score", 0)
            if fraud_score >= 0.85:
                severity = "critical"
            elif fraud_score > 0.7:
                severity = "high"
            else:
                severity = "medium"
                
            alert_data = {
                "user_id": user_id,
                "tx_id": transaction_id,
                "type": "fraud",
                "score": fraud_score,
                "reason": fraud_result.get("reason", "High fraud risk detected"),
                "severity": severity,
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


async def persist_analysis_results_async(
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
        print(f"[DB] Looking up transaction ID for plaid_transaction_id: {plaid_transaction_id}")
        transaction_id = get_transaction_id_from_plaid_id(plaid_transaction_id)
        
        # For test transactions or when transaction doesn't exist, we can still create insights
        # but we'll skip transaction and alert updates
        if not transaction_id:
            print(f"[DB] WARNING: Transaction not found in database for plaid_transaction_id: {plaid_transaction_id}")
            print(f"[DB] Will create insight only (skipping transaction/alert updates)")
        else:
            print(f"[DB] Found transaction_id: {transaction_id}")
        
        # Run all database operations in parallel using asyncio
        print(f"[DB] Starting parallel database operations...")
        
        try:
            # Since we're in an async context and the functions are synchronous,
            # just call them directly (they're fast database operations)
            print(f"[DB] Executing database operations...")
            
            # Always try to create insight and update run
            insight_result = create_insight_record(user_id, run_id, final_insight, plaid_transaction_id)
            run_update = update_agent_run_completion(run_id, timings)
            
            # Only update transaction and create alerts if transaction exists in DB
            if transaction_id:
                tx_update = update_transaction_with_analysis(transaction_id, analysis_results)
                alerts_result = create_alerts_from_analysis(user_id, transaction_id, analysis_results)
                print(f"[DB] Database operations completed (with transaction updates)")
            else:
                # Skip transaction and alerts for test transactions
                tx_update = {"status": "skipped", "message": "Transaction not in database", "updated": False}
                alerts_result = {"status": "skipped", "alerts_created": []}
                print(f"[DB] Database operations completed (insight & run update only)")
        except Exception as e:
            print(f"[DB] ERROR in parallel operations: {e}")
            import traceback
            traceback.print_exc()
            raise
        
        # Process transaction update result
        if isinstance(tx_update, dict):
            if tx_update.get("status") == "success":
                results["transaction_updated"] = tx_update.get("updated", False)
            elif tx_update.get("status") == "skipped":
                print(f"[DB] Transaction update skipped: {tx_update.get('message')}")
            else:
                results["errors"].append(f"Transaction update failed: {tx_update.get('error', 'Unknown error')}")
        elif isinstance(tx_update, Exception):
            results["errors"].append(f"Transaction update failed: {str(tx_update)}")
        
        # Process insight creation result
        if isinstance(insight_result, dict) and insight_result.get("status") == "success":
            results["insight_created"] = True
            results["insight_id"] = insight_result.get("insight_id")
            # If a critical alert was also created, add it to the alerts list
            if insight_result.get("alert_id"):
                if "alerts_created" not in results or results["alerts_created"] is None:
                    results["alerts_created"] = []
                results["alerts_created"].append({
                    "type": "fraud",
                    "id": insight_result.get("alert_id"),
                    "severity": "critical"
                })
                print(f"[DB] Critical alert created with ID: {insight_result.get('alert_id')}")
            print(f"[DB] Insight created with ID: {results['insight_id']}")
        elif isinstance(insight_result, Exception):
            error_msg = f"Insight creation failed: {str(insight_result)}"
            print(f"[DB] {error_msg}")
            results["errors"].append(error_msg)
        else:
            error_msg = f"Insight creation failed: {insight_result.get('error', 'Unknown error')}"
            print(f"[DB] {error_msg}")
            results["errors"].append(error_msg)
        
        # Process alerts result
        if isinstance(alerts_result, dict):
            if alerts_result.get("status") == "success":
                results["alerts_created"] = alerts_result.get("alerts_created", [])
            elif alerts_result.get("status") == "skipped":
                print(f"[DB] Alert creation skipped")
            else:
                results["errors"].append(f"Alert creation failed: {alerts_result.get('error', 'Unknown error')}")
        elif isinstance(alerts_result, Exception):
            results["errors"].append(f"Alert creation failed: {str(alerts_result)}")
        
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
