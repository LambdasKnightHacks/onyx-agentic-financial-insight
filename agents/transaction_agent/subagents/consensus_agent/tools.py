"""
Consensus Agent Tools

Utility functions for conflict detection, consensus building, and pattern learning.
Handles A2A communication coordination and multi-agent collaboration logic.
"""

from typing import Dict, Any, List
from ...a2a import a2a_client


def detect_conflicts(categorization: Dict, fraud: Dict, budget: Dict, cashflow: Dict) -> List[Dict[str, Any]]:
    """Detect conflicts between agent results."""
    conflicts = []
    
    # Conflict 1: Fraud vs Categorization
    fraud_score = fraud.get("fraud_score", 0.0)
    categorization_confidence = categorization.get("confidence", 0.0)
    
    if fraud_score > 0.7 and categorization_confidence < 0.5:
        conflicts.append({
            "type": "fraud_vs_categorization",
            "description": "High fraud score conflicts with low categorization confidence",
            "signals": {
                "fraud_score": fraud_score,
                "categorization_confidence": categorization_confidence
            },
            "involved_agents": ["fraud_agent", "categorization_agent"],
            "severity": "high"
        })
    elif fraud_score < 0.3 and categorization_confidence > 0.8:
        conflicts.append({
            "type": "fraud_vs_categorization",
            "description": "Low fraud score conflicts with high categorization confidence",
            "signals": {
                "fraud_score": fraud_score,
                "categorization_confidence": categorization_confidence
            },
            "involved_agents": ["fraud_agent", "categorization_agent"],
            "severity": "medium"
        })
    
    # Conflict 2: Budget vs Cashflow
    budget_over = budget.get("over_budget", False)
    cashflow_runway = cashflow.get("runway_days", 0)
    
    if budget_over and cashflow_runway > 90:
        conflicts.append({
            "type": "budget_vs_cashflow",
            "description": "Over budget but healthy cashflow runway",
            "signals": {
                "over_budget": budget_over,
                "runway_days": cashflow_runway
            },
            "involved_agents": ["budget_agent", "cashflow_agent"],
            "severity": "medium"
        })
    
    return conflicts


def build_consensus_from_responses(responses: List[Dict], conflict: Dict) -> Dict[str, Any]:
    """Build consensus from agent responses."""
    if len(responses) < 2:
        return {
            "resolution": "insufficient_responses",
            "confidence": 0.5,
            "reasoning": "Not enough agent responses for consensus"
        }
    
    # Analyze responses
    response1 = responses[0]["response"]
    response2 = responses[1]["response"]
    
    confidence1 = response1.get("confidence", 0.5)
    confidence2 = response2.get("confidence", 0.5)
    
    # Determine consensus
    if confidence1 > confidence2 + 0.2:
        # Agent 1 has significantly higher confidence
        return {
            "resolution": "agent_1_preferred",
            "preferred_agent": responses[0]["agent"],
            "confidence": confidence1,
            "reasoning": f"{responses[0]['agent']} has higher confidence ({confidence1:.2f} vs {confidence2:.2f})"
        }
    elif confidence2 > confidence1 + 0.2:
        # Agent 2 has significantly higher confidence
        return {
            "resolution": "agent_2_preferred",
            "preferred_agent": responses[1]["agent"],
            "confidence": confidence2,
            "reasoning": f"{responses[1]['agent']} has higher confidence ({confidence2:.2f} vs {confidence1:.2f})"
        }
    else:
        # Similar confidence levels - use recommendation
        rec1 = response1.get("recommendation", "unknown")
        rec2 = response2.get("recommendation", "unknown")
        
        if rec1 == rec2:
            return {
                "resolution": "consensus_agreement",
                "confidence": (confidence1 + confidence2) / 2,
                "reasoning": f"Both agents agree on recommendation: {rec1}"
            }
        else:
            return {
                "resolution": "mixed_signals",
                "confidence": 0.6,
                "reasoning": f"Mixed signals: {rec1} vs {rec2}"
            }


def calculate_consensus_confidence(resolved_conflicts: List[Dict]) -> float:
    """Calculate overall consensus confidence."""
    if not resolved_conflicts:
        return 1.0
    
    total_confidence = sum(conflict.get("confidence", 0.5) for conflict in resolved_conflicts)
    return total_confidence / len(resolved_conflicts)


async def facilitate_pattern_learning(categorization: Dict, fraud: Dict, budget: Dict, cashflow: Dict) -> List[Dict[str, Any]]:
    """Facilitate pattern learning between agents."""
    insights = []
    
    # Pattern 1: Fraud agent learns from categorization
    if fraud.get("fraud_score", 0) > 0.8:
        merchant_name = "unknown_merchant"  # Would get from transaction
        pattern_insight = {
            "type": "fraud_pattern_learning",
            "pattern_type": "merchant_pattern",
            "pattern_data": {
                "merchant": merchant_name,
                "fraud_score": fraud.get("fraud_score", 0),
                "alerts": fraud.get("alerts", [])
            },
            "source_agent": "fraud_agent",
            "target_agent": "categorization_agent"
        }
        
        # Send pattern learning message
        response = await a2a_client.send_message(
            from_agent="consensus_agent",
            to_agent="categorization_agent",
            message=pattern_insight
        )
        
        if response:
            insights.append({
                "type": "pattern_learning",
                "from": "fraud_agent",
                "to": "categorization_agent",
                "status": "success"
            })
    
    # Pattern 2: Budget agent learns from cashflow
    if budget.get("over_budget", False):
        spending_pattern = {
            "type": "spending_pattern_learning",
            "pattern_type": "budget_optimization",
            "pattern_data": {
                "category": "unknown_category",  # Would get from transaction
                "over_budget": True,
                "budget_percentage": budget.get("budget_percentage", 0)
            },
            "source_agent": "budget_agent",
            "target_agent": "cashflow_agent"
        }
        
        response = await a2a_client.send_message(
            from_agent="consensus_agent",
            to_agent="cashflow_agent",
            message=spending_pattern
        )
        
        if response:
            insights.append({
                "type": "pattern_learning",
                "from": "budget_agent",
                "to": "cashflow_agent",
                "status": "success"
            })
    
    return insights


def create_consensus_data(conflicts: List[Dict], resolved_conflicts: List[Dict], pattern_insights: List[Dict]) -> Dict[str, Any]:
    """Create structured consensus data."""
    return {
        "conflicts_detected": len(conflicts),
        "conflicts_resolved": len(resolved_conflicts),
        "consensus_confidence": calculate_consensus_confidence(resolved_conflicts),
        "agent_collaborations": [
            {
                "conflict_type": conflict["type"],
                "resolution": resolution["resolution"],
                "confidence": resolution["confidence"]
            }
            for conflict, resolution in zip(conflicts, resolved_conflicts)
        ],
        "resolved_conflicts": resolved_conflicts,
        "pattern_insights": pattern_insights
    }
