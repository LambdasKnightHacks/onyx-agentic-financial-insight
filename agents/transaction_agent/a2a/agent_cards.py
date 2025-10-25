"""
A2A Agent Card Definitions

Defines agent cards for A2A communication, including capabilities and endpoints.
"""

from typing import Dict, Any, List


def create_fraud_agent_card() -> Dict[str, Any]:
    """Create agent card for fraud detection agent."""
    return {
        "name": "fraud_agent",
        "description": "Detects fraudulent transactions and suspicious patterns",
        "skills": [
            "fraud_detection",
            "pattern_analysis", 
            "risk_assessment",
            "merchant_verification_request"
        ],
        "capabilities": {
            "can_request": ["merchant_verification", "pattern_analysis"],
            "can_provide": ["fraud_scores", "risk_assessments", "suspicious_patterns"]
        },
        "endpoints": {
            "primary": "fraud_agent",
            "a2a_port": 8001
        }
    }


def create_categorization_agent_card() -> Dict[str, Any]:
    """Create agent card for categorization agent."""
    return {
        "name": "categorization_agent",
        "description": "Categorizes transactions and identifies merchant patterns",
        "skills": [
            "transaction_categorization",
            "merchant_identification",
            "merchant_verification",
            "pattern_recognition"
        ],
        "capabilities": {
            "can_request": ["fraud_context", "transaction_history"],
            "can_provide": ["merchant_verification", "category_confidence", "merchant_context"]
        },
        "endpoints": {
            "primary": "categorization_agent",
            "a2a_port": 8002
        }
    }


def create_budget_agent_card() -> Dict[str, Any]:
    """Create agent card for budget analysis agent."""
    return {
        "name": "budget_agent",
        "description": "Analyzes budget compliance and spending patterns",
        "skills": [
            "budget_analysis",
            "spending_optimization",
            "scenario_planning",
            "trend_analysis"
        ],
        "capabilities": {
            "can_request": ["cashflow_scenarios", "spending_projections"],
            "can_provide": ["budget_status", "optimization_tips", "spending_trends"]
        },
        "endpoints": {
            "primary": "budget_agent",
            "a2a_port": 8003
        }
    }


def create_cashflow_agent_card() -> Dict[str, Any]:
    """Create agent card for cashflow analysis agent."""
    return {
        "name": "cashflow_agent",
        "description": "Forecasts cashflow and analyzes financial runway",
        "skills": [
            "cashflow_forecasting",
            "runway_analysis",
            "scenario_modeling",
            "financial_planning"
        ],
        "capabilities": {
            "can_request": ["budget_scenarios", "spending_reductions"],
            "can_provide": ["runway_projections", "scenario_analysis", "financial_advice"]
        },
        "endpoints": {
            "primary": "cashflow_agent",
            "a2a_port": 8004
        }
    }


def create_consensus_agent_card() -> Dict[str, Any]:
    """Create agent card for consensus building agent."""
    return {
        "name": "consensus_agent",
        "description": "Builds consensus between agents and resolves conflicts",
        "skills": [
            "conflict_resolution",
            "consensus_building",
            "multi_agent_coordination",
            "decision_synthesis"
        ],
        "capabilities": {
            "can_request": ["agent_clarifications", "conflict_resolution"],
            "can_provide": ["consensus_decisions", "conflict_resolutions", "coordinated_insights"]
        },
        "endpoints": {
            "primary": "consensus_agent",
            "a2a_port": 8005
        }
    }


def get_all_agent_cards() -> Dict[str, Dict[str, Any]]:
    """Get all agent cards."""
    return {
        "fraud_agent": create_fraud_agent_card(),
        "categorization_agent": create_categorization_agent_card(),
        "budget_agent": create_budget_agent_card(),
        "cashflow_agent": create_cashflow_agent_card(),
        "consensus_agent": create_consensus_agent_card()
    }
