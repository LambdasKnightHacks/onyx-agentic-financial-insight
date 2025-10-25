"""Output formatting utilities for agent responses."""

from typing import Dict, Any
from datetime import datetime
from .validators import validate_alert_data

def format_insight_data(
    title: str,
    body: str,
    severity: str,
    transaction_data: Dict[str, Any],
    analysis_results: Dict[str, Any],
    user_id: str,
    run_id: str = None
) -> Dict[str, Any]:
    """
    Format insight data for database storage (insights table).
    
    Args:
        title: Insight title
        body: Natural language description
        severity: 'info', 'warn', or 'critical'
        transaction_data: Original transaction
        analysis_results: Combined analysis results
        user_id: User UUID
        run_id: Agent run UUID (optional)
        
    Returns:
        Formatted insight dictionary matching schema
    """
    return {
        "user_id": user_id,
        "run_id": run_id,
        "title": title,
        "body": body,
        "severity": severity,
        "data": {
            "transaction": {
                "amount": transaction_data.get("amount"),
                "merchant": transaction_data.get("merchant_name"),
                "category": analysis_results.get("category"),
                "subcategory": analysis_results.get("subcategory"),
                "posted_at": transaction_data.get("posted_at")
            },
            "analysis": {
                "fraud_score": analysis_results.get("fraud_score"),
                "category_confidence": analysis_results.get("category_confidence"),
                "budget_status": analysis_results.get("budget_status"),
                "runway_days": analysis_results.get("runway_days"),
                "alerts": analysis_results.get("alerts", [])
            },
            "generated_at": datetime.utcnow().isoformat()
        }
    }

def format_alert_data(
    alert_type: str,
    transaction_id: str,
    user_id: str,
    score: float = None,
    reason: str = None,
    severity: str = "info",
    status: str = None
) -> Dict[str, Any]:
    """
    Format alert data for database storage (alerts table).
    
    Args:
        alert_type: Type of alert (duplicate, velocity, outlier, geo, fraud, budget, cashflow)
        transaction_id: Transaction UUID
        user_id: User UUID
        score: Alert score (0-1)
        reason: Human-readable reason
        severity: 'info', 'warn', or 'critical'
        status: Alert status (optional)
        
    Returns:
        Formatted alert dictionary matching schema
    """
    alert_data = {
        "type": alert_type,
        "tx_id": transaction_id,
        "user_id": user_id,
        "score": score,
        "reason": reason,
        "severity": severity,
        "resolved": False,  # Default from schema
        "status": status
    }
    
    return validate_alert_data(alert_data)

def format_agent_run_data(
    user_id: str,
    batch_id: str = None,
    mode: str = "per_tx",
    status: str = "running",
    timings: Dict[str, float] = None,
    meta: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Format agent run data for tracking (agent_runs table).
    
    Args:
        user_id: User UUID
        batch_id: Batch identifier (optional)
        mode: 'per_tx' or 'micro_batch'
        status: 'running', 'partial', 'done', or 'error'
        timings: Dictionary of agent execution times
        meta: Additional metadata
        
    Returns:
        Formatted agent run dictionary matching schema
    """
    return {
        "user_id": user_id,
        "batch_id": batch_id,
        "mode": mode,
        "status": status,
        "started_at": datetime.utcnow().isoformat(),
        "timings": timings or {},
        "meta": meta or {}
    }

def format_transaction_update_data(
    transaction_id: str,
    category: str = None,
    subcategory: str = None,
    category_confidence: float = None,
    fraud_score: float = None,
    category_reason: str = None
) -> Dict[str, Any]:
    """
    Format transaction update data for AI-enhanced fields.
    
    Args:
        transaction_id: Transaction UUID
        category: Detected category
        subcategory: Detected subcategory
        category_confidence: Confidence score (0-1)
        fraud_score: Fraud risk score (0-1)
        category_reason: Human-readable reasoning
        
    Returns:
        Dictionary with only the fields to update
    """
    update_data = {}
    
    if category is not None:
        update_data["category"] = category
    if subcategory is not None:
        update_data["subcategory"] = subcategory
    if category_confidence is not None:
        update_data["category_confidence"] = category_confidence
    if fraud_score is not None:
        update_data["fraud_score"] = fraud_score
    if category_reason is not None:
        update_data["category_reason"] = category_reason
    
    return update_data

def format_category_rule_data(
    user_id: str,
    pattern: str,
    category: str,
    priority: int = 100
) -> Dict[str, Any]:
    """
    Format category rule data for database storage.
    
    Args:
        user_id: User UUID
        pattern: Regex/pattern to match
        category: Category to assign
        priority: Rule priority (lower = higher priority)
        
    Returns:
        Formatted category rule dictionary
    """
    return {
        "user_id": user_id,
        "pattern": pattern,
        "category": category,
        "priority": priority
    }