"""
Reducer Agent Tools

Utility functions for merging and normalizing analysis results from parallel agents.
Handles data validation, risk calculation, and result structuring.
"""

from typing import Dict, Any
from datetime import datetime


def normalize_categorization(result: Dict) -> Dict[str, Any]:
    """Normalize categorization result with defaults."""
    if not result or result.get("error"):
        return {
            "status": "failed",
            "category": "unknown",
            "subcategory": "unknown", 
            "confidence": 0.0,
            "reason": result.get("error", "Categorization agent failed")
        }
    
    return {
        "status": "success",
        "category": result.get("category", "unknown"),
        "subcategory": result.get("subcategory", "unknown"),
        "confidence": float(result.get("confidence", 0.0)),
        "reason": result.get("reason", "Categorization completed")
    }


def normalize_fraud(result: Dict) -> Dict[str, Any]:
    """Normalize fraud detection result with defaults."""
    if not result or result.get("error"):
        return {
            "status": "failed",
            "fraud_score": 0.0,
            "alerts": [],
            "reason": result.get("error", "Fraud agent failed"),
            "checks_performed": []
        }
    
    return {
        "status": "success",
        "fraud_score": float(result.get("fraud_score", 0.0)),
        "alerts": result.get("alerts", []),
        "reason": result.get("reason", "Fraud analysis completed"),
        "checks_performed": result.get("checks", [])
    }


def normalize_budget(result: Dict) -> Dict[str, Any]:
    """Normalize budget analysis result with defaults."""
    if not result or result.get("error"):
        return {
            "status": "failed",
            "over_budget": False,
            "budget_percentage": 0.0,
            "category_trend": "unknown",
            "tips": [],
            "alert": result.get("error", "Budget agent failed")
        }
    
    return {
        "status": "success",
        "over_budget": bool(result.get("over_budget", False)),
        "budget_percentage": float(result.get("budget_percentage", 0.0)),
        "category_trend": result.get("category_trend", "unknown"),
        "tips": result.get("tips", []),
        "alert": result.get("alert", "Budget analysis completed")
    }


def normalize_cashflow(result: Dict) -> Dict[str, Any]:
    """Normalize cashflow forecast result with defaults."""
    if not result or result.get("error"):
        return {
            "status": "failed",
            "runway_days": 0,
            "low_balance_alert": True,
            "severity": "critical",
            "forecast": {},
            "recommendations": [result.get("error", "Cashflow agent failed")]
        }
    
    return {
        "status": "success",
        "runway_days": int(result.get("runway_days", 0)),
        "low_balance_alert": bool(result.get("low_balance_alert", False)),
        "severity": result.get("severity", "info"),
        "forecast": result.get("forecast", {}),
        "recommendations": result.get("recommendations", [])
    }


def calculate_overall_risk(fraud: Dict, budget: Dict, cashflow: Dict) -> float:
    """Calculate overall risk score from all agents."""
    risk_factors = []
    
    # Fraud risk (0.0 - 1.0)
    if fraud and not fraud.get("error"):
        risk_factors.append(float(fraud.get("fraud_score", 0.0)))
    
    # Budget risk (0.0 - 1.0 based on overage percentage)
    if budget and not budget.get("error"):
        budget_percentage = float(budget.get("budget_percentage", 0.0))
        budget_risk = min(budget_percentage / 100.0, 1.0) if budget.get("over_budget") else 0.0
        risk_factors.append(budget_risk)
    
    # Cashflow risk (0.0 - 1.0 based on runway)
    if cashflow and not cashflow.get("error"):
        runway_days = int(cashflow.get("runway_days", 0))
        if runway_days <= 7:
            cashflow_risk = 1.0
        elif runway_days <= 30:
            cashflow_risk = 0.7
        elif runway_days <= 90:
            cashflow_risk = 0.3
        else:
            cashflow_risk = 0.0
        risk_factors.append(cashflow_risk)
    
    # Return average risk score
    return sum(risk_factors) / len(risk_factors) if risk_factors else 0.0


def identify_primary_concerns(fraud: Dict, budget: Dict, cashflow: Dict) -> list[str]:
    """Identify primary concerns based on agent results."""
    concerns = []
    
    # Fraud concerns
    if fraud and not fraud.get("error"):
        fraud_score = float(fraud.get("fraud_score", 0.0))
        if fraud_score > 0.7:
            concerns.append("High fraud risk detected")
        elif fraud_score > 0.4:
            concerns.append("Moderate fraud risk")
    
    # Budget concerns
    if budget and not budget.get("error"):
        if budget.get("over_budget"):
            concerns.append("Over budget spending")
        if budget.get("category_trend") == "increasing":
            concerns.append("Increasing spending trend")
    
    # Cashflow concerns
    if cashflow and not cashflow.get("error"):
        runway_days = int(cashflow.get("runway_days", 0))
        if runway_days <= 7:
            concerns.append("Critical cashflow situation")
        elif runway_days <= 30:
            concerns.append("Low cashflow runway")
    
    return concerns


def prioritize_recommendations(fraud: Dict, budget: Dict, cashflow: Dict) -> list[str]:
    """Prioritize recommendations based on severity."""
    priorities = []
    
    # High priority: Critical cashflow
    if cashflow and not cashflow.get("error"):
        runway_days = int(cashflow.get("runway_days", 0))
        if runway_days <= 7:
            priorities.append("URGENT: Address cashflow crisis")
    
    # High priority: High fraud risk
    if fraud and not fraud.get("error"):
        fraud_score = float(fraud.get("fraud_score", 0.0))
        if fraud_score > 0.7:
            priorities.append("HIGH: Investigate fraud risk")
    
    # Medium priority: Budget issues
    if budget and not budget.get("error"):
        if budget.get("over_budget"):
            priorities.append("MEDIUM: Reduce spending to stay within budget")
    
    return priorities


def merge_results(categorization: Dict, fraud: Dict, budget: Dict, cashflow: Dict) -> Dict[str, Any]:
    """Merge all agent results into a unified structure."""
    
    merged = {
        "transaction_analysis": {
            "categorization": normalize_categorization(categorization),
            "fraud_detection": normalize_fraud(fraud),
            "budget_analysis": normalize_budget(budget),
            "cashflow_forecast": normalize_cashflow(cashflow)
        },
        "summary": {
            "overall_risk_score": calculate_overall_risk(fraud, budget, cashflow),
            "primary_concerns": identify_primary_concerns(fraud, budget, cashflow),
            "recommendations_priority": prioritize_recommendations(fraud, budget, cashflow)
        }
    }
    
    return merged


def get_timestamp() -> str:
    """Get current timestamp for metadata."""
    return datetime.now().isoformat()
