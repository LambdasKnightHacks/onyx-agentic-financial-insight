"""
Agent Result Extractor

Extracts and formats agent results for WebSocket streaming.
Converts raw agent outputs into UI-friendly data structures.
"""

from typing import Dict, Any, Optional
from datetime import datetime

class AgentResultExtractor:
    """Extracts and formats agent results for WebSocket streaming"""
    
    @staticmethod
    def extract_categorization_result(session_state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        result = session_state.get("categorization_result", {})
        
        # Check for actual result data
        if not result:
            return None
        
        # Handle error cases - still show in UI with error indicator
        if "error" in result and result.get("category") == "unknown":
            return {
                "agent_name": "categorization_agent",
                "status": "error",
                "result": result,
                "message": f"Categorization error: {result.get('reason', 'Unknown error')}",
                "ui_data": {
                    "display_title": f"Category: {result.get('category', 'unknown')}",
                    "confidence_percentage": "0.0%",
                    "icon": "alert-circle",
                    "color": "orange",
                    "category": result.get('category', 'unknown'),
                    "subcategory": result.get('subcategory', 'unknown'),
                    "confidence": 0.0,
                    "error": result.get('error')
                }
            }
        
        # Check for category field (should always exist now with defensive coding)
        if "category" not in result:
            return None
        
        # Success case
        confidence = result.get('confidence', 0)
        category = result.get('category', 'unknown')
        subcategory = result.get('subcategory', 'unknown')
        
        # Determine color based on confidence and category
        if category == "unknown":
            color = "orange"
        elif confidence > 0.8:
            color = "green"
        elif confidence > 0.5:
            color = "yellow"
        else:
            color = "orange"
        
        return {
            "agent_name": "categorization_agent",
            "status": "completed",
            "result": result,
            "message": f"Categorized as {category}/{subcategory}",
            "ui_data": {
                "display_title": f"Categorized as {category}",
                "confidence_percentage": f"{confidence * 100:.1f}%",
                "icon": "tag",
                "color": color,
                "category": category,
                "subcategory": subcategory,
                "confidence": confidence,
                "reason": result.get('reason')
            }
        }
    
    @staticmethod
    def extract_fraud_result(session_state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        result = session_state.get("fraud_result", {})
        # Check for actual result data instead of status field
        if not result or "fraud_score" not in result:
            return None
        
        fraud_score = result.get("fraud_score", 0)
        alerts = result.get("alerts", [])
        
        # Determine risk level with more granular thresholds
        if fraud_score >= 0.85:
            risk_level = "severe"
            color = "red"
        elif fraud_score > 0.7:
            risk_level = "high"
            color = "red"
        elif fraud_score > 0.4:
            risk_level = "medium"
            color = "orange"
        else:
            risk_level = "low"
            color = "green"
        
        return {
            "agent_name": "fraud_agent",
            "status": "completed",
            "result": result,
            "message": f"Fraud analysis complete: score {fraud_score:.2f}, {len(alerts)} alerts",
            "ui_data": {
                "display_title": f"Fraud Risk: {fraud_score:.2f} ({risk_level.title()})",
                "risk_level": risk_level,
                "icon": "shield",
                "color": color,
                "fraud_score": fraud_score,
                "alerts": alerts,
                "reason": result.get("reason")
            }
        }
    
    @staticmethod
    def extract_budget_result(session_state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        result = session_state.get("budget_result", {})
        # Check for actual result data instead of status field
        if not result or "budget_percentage" not in result:
            return None
        
        over_budget = result.get("over_budget", False)
        percentage = result.get("budget_percentage", 0)
        
        return {
            "agent_name": "budget_agent",
            "status": "completed",
            "result": result,
            "message": f"Budget analysis: {'Over budget' if over_budget else 'Within budget'} ({percentage:.1f}%)",
            "ui_data": {
                "display_title": f"Budget: {'Over' if over_budget else 'Within'} ({percentage:.1f}%)",
                "status": "over" if over_budget else "within",
                "icon": "wallet",
                "color": "red" if over_budget else "green",
                "budget_percentage": percentage,
                "category_trend": result.get("category_trend"),
                "tips": result.get("tips", [])
            }
        }
    
    @staticmethod
    def extract_cashflow_result(session_state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        result = session_state.get("cashflow_result", {})
        # Check for actual result data instead of status field  
        if not result or "runway_days" not in result:
            return None
        
        runway_days = result.get("runway_days", 0)
        severity = result.get("severity", "info")
        
        return {
            "agent_name": "cashflow_agent",
            "status": "completed",
            "result": result,
            "message": f"Cashflow analysis: {runway_days} day runway, {severity.title()}",
            "ui_data": {
                "display_title": f"Cashflow: {runway_days} days",
                "runway_days": runway_days,
                "severity": severity,
                "icon": "trending-up",
                "color": "red" if runway_days < 7 else "orange" if runway_days < 30 else "green",
                "low_balance_alert": result.get("low_balance_alert", False),
                "recommendations": result.get("recommendations", [])
            }
        }
    
    @staticmethod
    def extract_synthesizer_result(session_state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        result = session_state.get("final_insight", {})
        if not result:
            return None
        
        severity = result.get("severity", "info")
        title = result.get("title", "Analysis Complete")
        
        return {
            "agent_name": "synthesizer_agent",
            "status": "completed",
            "result": result,
            "message": f"Generated comprehensive insight: {title}",
            "ui_data": {
                "display_title": title,
                "severity": severity,
                "icon": "lightbulb",
                "color": "red" if severity == "critical" else "orange" if severity == "warning" else "blue",
                "body": result.get("body"),
                "data": result.get("data", {}),
                "recommendations": result.get("data", {}).get("recommendations", [])
            }
        }
