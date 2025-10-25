"""
A2A Message Handlers

Handles specific A2A message types for each agent in the transaction analysis pipeline.
"""

from typing import Dict, Any
from .a2a_client import A2AMessageHandler


class FraudAgentMessageHandler(A2AMessageHandler):
    """Message handler for fraud agent."""
    
    def __init__(self):
        super().__init__("fraud_agent")
        self.learned_patterns = {}
    
    async def handle_merchant_verification(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle merchant verification requests (fraud agent doesn't receive these)."""
        return {"error": "Fraud agent doesn't handle merchant verification requests"}
    
    async def handle_scenario_planning(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle scenario planning requests (fraud agent doesn't receive these)."""
        return {"error": "Fraud agent doesn't handle scenario planning requests"}
    
    async def handle_conflict_resolution(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle conflict resolution requests."""
        conflict_type = message.get("conflict_type", "unknown")
        conflicting_signals = message.get("conflicting_signals", [])
        
        if conflict_type == "fraud_vs_categorization":
            # Provide fraud perspective on conflict
            fraud_score = conflicting_signals.get("fraud_score", 0.0)
            categorization_confidence = conflicting_signals.get("categorization_confidence", 0.0)
            
            if fraud_score > 0.7 and categorization_confidence < 0.5:
                return {
                    "agent_perspective": "fraud",
                    "confidence": 0.8,
                    "reasoning": "High fraud score with low categorization confidence suggests suspicious activity",
                    "recommendation": "investigate_further"
                }
            elif fraud_score < 0.3 and categorization_confidence > 0.8:
                return {
                    "agent_perspective": "fraud",
                    "confidence": 0.9,
                    "reasoning": "Low fraud score with high categorization confidence suggests legitimate transaction",
                    "recommendation": "approve_transaction"
                }
            else:
                return {
                    "agent_perspective": "fraud",
                    "confidence": 0.6,
                    "reasoning": "Mixed signals require additional verification",
                    "recommendation": "seek_additional_evidence"
                }
        
        return {"error": f"Unknown conflict type: {conflict_type}"}
    
    async def handle_pattern_learning(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle pattern learning requests."""
        pattern_type = message.get("pattern_type", "unknown")
        pattern_data = message.get("pattern_data", {})
        
        # Store learned pattern
        pattern_id = f"{pattern_type}_{len(self.learned_patterns)}"
        self.learned_patterns[pattern_id] = {
            "type": pattern_type,
            "data": pattern_data,
            "learned_at": message.get("timestamp", "unknown"),
            "source_agent": message.get("source_agent", "unknown")
        }
        
        return {
            "status": "pattern_learned",
            "pattern_id": pattern_id,
            "acknowledgment": f"Learned {pattern_type} pattern from {message.get('source_agent', 'unknown')}"
        }


class CategorizationAgentMessageHandler(A2AMessageHandler):
    """Message handler for categorization agent."""
    
    def __init__(self):
        super().__init__("categorization_agent")
        self.merchant_database = {
            "starbucks": {"category": "food", "subcategory": "coffee_tea", "confidence": 0.95},
            "mcdonalds": {"category": "food", "subcategory": "fast_food", "confidence": 0.98},
            "amazon": {"category": "shopping", "subcategory": "online", "confidence": 0.99},
            "shell": {"category": "transportation", "subcategory": "fuel", "confidence": 0.97}
        }
    
    async def handle_merchant_verification(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle merchant verification requests from fraud agent."""
        merchant = message.get("merchant", "").lower()
        amount = message.get("amount", 0)
        context = message.get("context", "")
        
        # Look up merchant in database
        if merchant in self.merchant_database:
            merchant_info = self.merchant_database[merchant]
            confidence = merchant_info["confidence"]
            
            # Adjust confidence based on context
            if context == "fraud_suspicious":
                # Fraud agent is suspicious, so we need high confidence to override
                if confidence > 0.8:
                    return {
                        "merchant_verified": True,
                        "confidence": confidence,
                        "category": merchant_info["category"],
                        "subcategory": merchant_info["subcategory"],
                        "verification_status": "verified",
                        "reasoning": f"Known merchant '{merchant}' with high confidence {confidence}"
                    }
                else:
                    return {
                        "merchant_verified": False,
                        "confidence": confidence,
                        "verification_status": "suspicious",
                        "reasoning": f"Merchant '{merchant}' has low confidence {confidence} for fraud context"
                    }
            else:
                return {
                    "merchant_verified": True,
                    "confidence": confidence,
                    "category": merchant_info["category"],
                    "subcategory": merchant_info["subcategory"],
                    "verification_status": "verified"
                }
        else:
            return {
                "merchant_verified": False,
                "confidence": 0.0,
                "verification_status": "unknown_merchant",
                "reasoning": f"Merchant '{merchant}' not found in database"
            }
    
    async def handle_scenario_planning(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle scenario planning requests (categorization agent doesn't receive these)."""
        return {"error": "Categorization agent doesn't handle scenario planning requests"}
    
    async def handle_conflict_resolution(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle conflict resolution requests."""
        conflict_type = message.get("conflict_type", "unknown")
        conflicting_signals = message.get("conflicting_signals", {})
        
        if conflict_type == "fraud_vs_categorization":
            categorization_confidence = conflicting_signals.get("categorization_confidence", 0.0)
            fraud_score = conflicting_signals.get("fraud_score", 0.0)
            
            if categorization_confidence > 0.8 and fraud_score < 0.3:
                return {
                    "agent_perspective": "categorization",
                    "confidence": 0.9,
                    "reasoning": "High categorization confidence with low fraud score suggests legitimate transaction",
                    "recommendation": "approve_transaction"
                }
            elif categorization_confidence < 0.5 and fraud_score > 0.7:
                return {
                    "agent_perspective": "categorization",
                    "confidence": 0.7,
                    "reasoning": "Low categorization confidence with high fraud score suggests suspicious activity",
                    "recommendation": "investigate_further"
                }
            else:
                return {
                    "agent_perspective": "categorization",
                    "confidence": 0.6,
                    "reasoning": "Mixed signals require additional verification",
                    "recommendation": "seek_additional_evidence"
                }
        
        return {"error": f"Unknown conflict type: {conflict_type}"}
    
    async def handle_pattern_learning(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle pattern learning requests."""
        pattern_type = message.get("pattern_type", "unknown")
        pattern_data = message.get("pattern_data", {})
        
        # Learn merchant patterns
        if pattern_type == "merchant_pattern":
            merchant = pattern_data.get("merchant", "").lower()
            if merchant and merchant not in self.merchant_database:
                # Add new merchant to database
                self.merchant_database[merchant] = {
                    "category": pattern_data.get("category", "unknown"),
                    "subcategory": pattern_data.get("subcategory", "unknown"),
                    "confidence": pattern_data.get("confidence", 0.5)
                }
                return {
                    "status": "merchant_learned",
                    "merchant": merchant,
                    "acknowledgment": f"Added new merchant '{merchant}' to database"
                }
        
        return {
            "status": "pattern_learned",
            "acknowledgment": f"Learned {pattern_type} pattern"
        }


class BudgetAgentMessageHandler(A2AMessageHandler):
    """Message handler for budget agent."""
    
    def __init__(self):
        super().__init__("budget_agent")
    
    async def handle_merchant_verification(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle merchant verification requests (budget agent doesn't receive these)."""
        return {"error": "Budget agent doesn't handle merchant verification requests"}
    
    async def handle_scenario_planning(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle scenario planning requests."""
        scenario_type = message.get("scenario_type", "unknown")
        current_spending = message.get("current_spending", 0)
        proposed_reduction = message.get("proposed_reduction", 0)
        category = message.get("category", "unknown")
        timeframe = message.get("timeframe", "30_days")
        
        if scenario_type == "spending_reduction_scenario":
            # Calculate scenario impact
            new_spending = current_spending - proposed_reduction
            monthly_savings = proposed_reduction
            
            # Estimate runway impact (simplified calculation)
            if timeframe == "30_days":
                runway_extension = int(proposed_reduction / 10)  # Simplified: $10 per day runway
            else:
                runway_extension = int(proposed_reduction / 5)  # More conservative
            
            return {
                "scenario_type": "spending_reduction",
                "new_spending": new_spending,
                "monthly_savings": monthly_savings,
                "runway_extension": runway_extension,
                "feasibility": "high" if proposed_reduction < current_spending * 0.5 else "medium",
                "recommendation": f"Reduce {category} spending by ${proposed_reduction} to save ${monthly_savings}/month"
            }
        
        return {"error": f"Unknown scenario type: {scenario_type}"}
    
    async def handle_conflict_resolution(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle conflict resolution requests."""
        conflict_type = message.get("conflict_type", "unknown")
        
        if conflict_type == "budget_vs_cashflow":
            return {
                "agent_perspective": "budget",
                "confidence": 0.7,
                "reasoning": "Budget analysis focuses on category limits and spending patterns",
                "recommendation": "balance_budget_and_cashflow"
            }
        
        return {"error": f"Unknown conflict type: {conflict_type}"}
    
    async def handle_pattern_learning(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle pattern learning requests."""
        pattern_type = message.get("pattern_type", "unknown")
        
        return {
            "status": "pattern_learned",
            "acknowledgment": f"Learned {pattern_type} pattern for budget optimization"
        }


class CashflowAgentMessageHandler(A2AMessageHandler):
    """Message handler for cashflow agent."""
    
    def __init__(self):
        super().__init__("cashflow_agent")
    
    async def handle_merchant_verification(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle merchant verification requests (cashflow agent doesn't receive these)."""
        return {"error": "Cashflow agent doesn't handle merchant verification requests"}
    
    async def handle_scenario_planning(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle scenario planning requests."""
        scenario_type = message.get("scenario_type", "unknown")
        reduction_amount = message.get("reduction_amount", 0)
        timeframe = message.get("timeframe", "30_days")
        
        if scenario_type == "spending_reduction_scenario":
            # Calculate cashflow impact
            current_runway = 30  # Assume 30 days current runway
            daily_savings = reduction_amount / 30 if timeframe == "30_days" else reduction_amount / 7
            
            # Calculate new runway
            new_runway = current_runway + int(reduction_amount / daily_savings)
            
            # Assess risk
            if new_runway > 90:
                risk_assessment = "low"
            elif new_runway > 30:
                risk_assessment = "medium"
            else:
                risk_assessment = "high"
            
            return {
                "scenario_type": "cashflow_impact",
                "current_runway": current_runway,
                "new_runway": new_runway,
                "runway_extension": new_runway - current_runway,
                "monthly_savings": reduction_amount,
                "risk_assessment": risk_assessment,
                "recommendation": f"Reducing spending by ${reduction_amount}/month extends runway to {new_runway} days"
            }
        
        return {"error": f"Unknown scenario type: {scenario_type}"}
    
    async def handle_conflict_resolution(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle conflict resolution requests."""
        conflict_type = message.get("conflict_type", "unknown")
        
        if conflict_type == "budget_vs_cashflow":
            return {
                "agent_perspective": "cashflow",
                "confidence": 0.8,
                "reasoning": "Cashflow analysis focuses on runway and financial sustainability",
                "recommendation": "prioritize_cashflow_sustainability"
            }
        
        return {"error": f"Unknown conflict type: {conflict_type}"}
    
    async def handle_pattern_learning(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle pattern learning requests."""
        pattern_type = message.get("pattern_type", "unknown")
        
        return {
            "status": "pattern_learned",
            "acknowledgment": f"Learned {pattern_type} pattern for cashflow forecasting"
        }
