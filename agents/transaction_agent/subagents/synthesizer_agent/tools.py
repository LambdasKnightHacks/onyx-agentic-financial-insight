"""
Synthesizer Agent Tools

Utility functions for formatting data, creating transaction summaries, and handling insight validation.
Supports LLM prompt preparation and fallback insight generation.
"""

from typing import Dict, Any
from datetime import datetime


def create_transaction_summary(transaction: Dict[str, Any]) -> str:
    """Create a human-readable transaction summary."""
    merchant = transaction.get("merchant_name", "Unknown Merchant")
    amount = transaction.get("amount", 0)
    description = transaction.get("description", "")
    posted_at = transaction.get("posted_at", "")
    
    summary = f"${amount:.2f} at {merchant}"
    if description and description != merchant:
        summary += f" ({description})"
    if posted_at:
        summary += f" on {posted_at}"
    
    return summary


def format_results_for_llm(merged_results: Dict[str, Any]) -> str:
    """Format merged results in a readable way for the LLM."""
    formatted = []
    
    # Transaction analysis section
    analysis = merged_results.get("transaction_analysis", {})
    
    # Categorization
    cat = analysis.get("categorization", {})
    if cat.get("status") == "success":
        formatted.append(f"Category: {cat['category']}/{cat['subcategory']} (confidence: {cat['confidence']:.2f})")
    else:
        formatted.append(f"Category: Failed - {cat.get('reason', 'Unknown error')}")
    
    # Fraud detection
    fraud = analysis.get("fraud_detection", {})
    if fraud.get("status") == "success":
        formatted.append(f"Fraud Risk: {fraud['fraud_score']:.2f} (alerts: {len(fraud['alerts'])})")
        if fraud['alerts']:
            formatted.append(f"  - Alerts: {', '.join(fraud['alerts'])}")
    else:
        formatted.append(f"Fraud Detection: Failed - {fraud.get('reason', 'Unknown error')}")
    
    # Budget analysis
    budget = analysis.get("budget_analysis", {})
    if budget.get("status") == "success":
        status = "Over budget" if budget['over_budget'] else "Within budget"
        formatted.append(f"Budget Status: {status} ({budget['budget_percentage']:.1f}% of limit)")
        formatted.append(f"Spending Trend: {budget['category_trend']}")
        if budget['tips']:
            formatted.append(f"  - Tips: {len(budget['tips'])} recommendations provided")
    else:
        formatted.append(f"Budget Analysis: Failed - {budget.get('reason', 'Unknown error')}")
    
    # Cashflow forecast
    cashflow = analysis.get("cashflow_forecast", {})
    if cashflow.get("status") == "success":
        formatted.append(f"Cashflow Runway: {cashflow['runway_days']} days")
        formatted.append(f"Severity: {cashflow['severity']}")
        if cashflow['recommendations']:
            formatted.append(f"  - Recommendations: {len(cashflow['recommendations'])} provided")
    else:
        formatted.append(f"Cashflow Forecast: Failed - {cashflow.get('reason', 'Unknown error')}")
    
    # Summary section
    summary = merged_results.get("summary", {})
    formatted.append(f"\nOverall Risk Score: {summary.get('overall_risk_score', 0.0):.2f}")
    
    concerns = summary.get("primary_concerns", [])
    if concerns:
        formatted.append(f"Primary Concerns: {', '.join(concerns)}")
    
    priorities = summary.get("recommendations_priority", [])
    if priorities:
        formatted.append(f"Priority Actions: {', '.join(priorities)}")
    
    return "\n".join(formatted)


def validate_and_enhance_insight(insight_dict: Dict[str, Any], merged_results: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and enhance the insight structure."""
    
    # Ensure required fields exist
    final_insight = {
        "title": insight_dict.get("title", "Transaction Analysis Complete"),
        "body": insight_dict.get("body", "Analysis completed successfully."),
        "severity": insight_dict.get("severity", "info"),
        "data": insight_dict.get("data", {})
    }
    
    # Enhance data section with defaults
    data = final_insight["data"]
    
    # Risk assessment
    if "risk_assessment" not in data:
        data["risk_assessment"] = {
            "overall_risk": "medium",
            "risk_factors": [],
            "risk_score": merged_results.get("summary", {}).get("overall_risk_score", 0.5)
        }
    
    # Recommendations
    if "recommendations" not in data:
        data["recommendations"] = []
    
    # Key metrics
    if "key_metrics" not in data:
        analysis = merged_results.get("transaction_analysis", {})
        data["key_metrics"] = {
            "fraud_score": analysis.get("fraud_detection", {}).get("fraud_score", 0.0),
            "budget_status": "within" if not analysis.get("budget_analysis", {}).get("over_budget") else "over",
            "cashflow_runway": analysis.get("cashflow_forecast", {}).get("runway_days", 0),
            "spending_trend": analysis.get("budget_analysis", {}).get("category_trend", "stable")
        }
    
    # Alerts and insights
    if "alerts" not in data:
        data["alerts"] = []
    if "insights" not in data:
        data["insights"] = []
    
    # Add metadata
    data["metadata"] = {
        "synthesizer_timestamp": get_timestamp(),
        "analysis_run_id": merged_results.get("metadata", {}).get("reducer_timestamp", "unknown")
    }
    
    return final_insight


def create_fallback_insight(merged_results: Dict[str, Any]) -> Dict[str, Any]:
    """Create a fallback insight if LLM parsing fails."""
    
    analysis = merged_results.get("transaction_analysis", {})
    summary = merged_results.get("summary", {})
    
    # Determine severity based on risk score
    risk_score = summary.get("overall_risk_score", 0.0)
    if risk_score > 0.7:
        severity = "critical"
    elif risk_score > 0.4:
        severity = "warning"
    else:
        severity = "info"
    
    # Create basic insight
    insight = {
        "title": "Transaction Analysis Complete",
        "body": f"Analysis completed with overall risk score of {risk_score:.2f}. " +
               f"Primary concerns: {', '.join(summary.get('primary_concerns', ['None identified']))}",
        "severity": severity,
        "data": {
            "risk_assessment": {
                "overall_risk": "high" if risk_score > 0.7 else "medium" if risk_score > 0.4 else "low",
                "risk_factors": summary.get("primary_concerns", []),
                "risk_score": risk_score
            },
            "recommendations": [
                {
                    "priority": "medium",
                    "category": "general",
                    "action": "Review transaction details and consider any alerts",
                    "reasoning": "Automated analysis completed",
                    "timeline": "short_term"
                }
            ],
            "key_metrics": {
                "fraud_score": analysis.get("fraud_detection", {}).get("fraud_score", 0.0),
                "budget_status": "within" if not analysis.get("budget_analysis", {}).get("over_budget") else "over",
                "cashflow_runway": analysis.get("cashflow_forecast", {}).get("runway_days", 0),
                "spending_trend": analysis.get("budget_analysis", {}).get("category_trend", "stable")
            },
            "alerts": analysis.get("fraud_detection", {}).get("alerts", []),
            "insights": summary.get("primary_concerns", []),
            "metadata": {
                "synthesizer_timestamp": get_timestamp(),
                "fallback_mode": True
            }
        }
    }
    
    return insight


def get_timestamp() -> str:
    """Get current timestamp for metadata."""
    return datetime.now().isoformat()
