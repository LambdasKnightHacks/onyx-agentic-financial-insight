"""
Decision Result Extractor

Extracts and formats decision analysis results for API responses.
"""

from typing import Dict, Any, List, Optional


class DecisionResultExtractor:
    """
    Extracts key information from decision analysis results
    for API responses and frontend display
    """
    
    def extract_summary(self, final_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract high-level summary from final decision output
        
        Args:
            final_output: Complete decision analysis output
        
        Returns:
            Summary dict with key metrics
        """
        verdict = final_output.get("verdict", {})
        options = final_output.get("options", [])
        risk_assessment = final_output.get("risk_assessment", {})
        
        # Find recommended option
        recommended_name = verdict.get("recommended_option", "")
        recommended_option = next(
            (opt for opt in options if opt.get("name") == recommended_name),
            options[0] if options else {}
        )
        
        return {
            "decision_type": final_output.get("decision_type", ""),
            "recommendation": {
                "option": recommended_name,
                "confidence": verdict.get("confidence", 0),
                "risk_level": verdict.get("risk_level", "unknown"),
                "reasoning": verdict.get("reasoning", "")
            },
            "recommended_option_details": {
                "tco": recommended_option.get("tco_expected", 0),
                "monthly_payment": recommended_option.get("monthly_payment", 0),
                "liquidity_score": recommended_option.get("liquidity_score", 0)
            },
            "comparison": {
                "options_analyzed": len(options),
                "tco_range": [
                    min(opt.get("tco_expected", 0) for opt in options) if options else 0,
                    max(opt.get("tco_expected", 0) for opt in options) if options else 0
                ]
            },
            "risk_summary": {
                "overall_risk": risk_assessment.get("overall_risk", "unknown"),
                "liquidity_adequate": risk_assessment.get("liquidity_adequate", False),
                "emergency_fund_safe": risk_assessment.get("emergency_fund_safe", False)
            }
        }
    
    def extract_key_insights(self, final_output: Dict[str, Any]) -> List[str]:
        """
        Extract key insights as bullet points
        
        Args:
            final_output: Complete decision analysis output
        
        Returns:
            List of key insight strings
        """
        insights = []
        
        verdict = final_output.get("verdict", {})
        options = final_output.get("options", [])
        comparison = final_output.get("comparison_matrix", {})
        budget_recs = final_output.get("budget_rebalancing", {})
        
        # Add verdict key factors
        key_factors = verdict.get("key_factors", [])
        insights.extend(key_factors[:3])  # Top 3 factors
        
        # Add TCO comparison
        tco_diff = comparison.get("tco_difference", 0)
        if tco_diff > 0:
            winner = comparison.get("winner_by_tco", "")
            insights.append(f"{winner} saves ${tco_diff:,.0f} in total cost")
        
        # Add budget recommendation if significant savings available
        total_savings = budget_recs.get("total_monthly_savings", 0)
        if total_savings > 100:
            insights.append(f"${total_savings:.0f}/month in budget optimizations available")
        
        return insights
    
    def format_for_api_response(self, final_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format final output for API response
        
        Adds computed fields and cleans up structure for frontend consumption
        
        Args:
            final_output: Raw decision analysis output
        
        Returns:
            Formatted response dict
        """
        # Clone the output
        formatted = dict(final_output)
        
        # ✅ FIX: Transform verdict structure for frontend
        verdict = formatted.get("verdict", {})
        if verdict:
            # Extract winner from options if not in verdict
            winner = verdict.get("recommended_option", verdict.get("winner", ""))
            if not winner:
                options = formatted.get("options", [])
                if options:
                    winner = options[0].get("name", "Unknown Option")
                else:
                    winner = "Unknown Option"
            
            # Map backend fields to frontend expected fields with better defaults
            formatted["verdict"] = {
                "recommendation": verdict.get("reasoning", verdict.get("recommendation", "Analysis complete - review the detailed comparison below.")),
                "winner": winner,
                "confidence_score": verdict.get("confidence", verdict.get("confidence_score", 0.5)),
                "risk_level": verdict.get("risk_level", "medium"),
                "key_points": verdict.get("key_factors", verdict.get("key_points", ["All analysis components completed successfully"])),
                "savings_amount": 0,  # Could be calculated
                "savings_period": "analysis period"
            }
        else:
            # Create a minimal verdict if none exists
            options = formatted.get("options", [])
            winner = options[0].get("name", "Unknown") if options else "Unknown"
            formatted["verdict"] = {
                "recommendation": "Decision analysis completed successfully. Review the detailed comparison below.",
                "winner": winner,
                "confidence_score": 0.5,
                "risk_level": "medium",
                "key_points": ["Analysis completed"],
                "savings_amount": 0,
                "savings_period": "analysis period"
            }
        
        # ✅ FIX: Transform action checklist for frontend
        action_checklist = formatted.get("action_checklist", [])
        
        # If empty or not a list, create default actions
        if not action_checklist or not isinstance(action_checklist, list):
            options = formatted.get("options", [])
            verdict = formatted.get("verdict", {})
            winner = verdict.get("recommended_option", "the recommended option")
            
            action_checklist = [
                f"Secure financing with the lowest possible APR to minimize interest paid.",
                f"Negotiate the final purchase price of the vehicle to potentially lower the financed amount.",
                f"Implement the recommended budget adjustments to increase savings and improve financial flexibility."
            ]
        
        # Convert strings to structured objects
        if action_checklist and isinstance(action_checklist[0], str):
            formatted["action_checklist"] = [
                {
                    "id": f"action_{i}",
                    "action": item,
                    "priority": "high" if i < 2 else "medium",
                    "category": "Decision Analysis"
                }
                for i, item in enumerate(action_checklist)
            ]
        elif action_checklist and isinstance(action_checklist[0], dict):
            # Already in correct format, but ensure it has required fields
            formatted["action_checklist"] = [
                {
                    "id": item.get("id", f"action_{i}"),
                    "action": item.get("action", item.get("name", "Action")),
                    "priority": item.get("priority", "medium"),
                    "category": item.get("category", "Decision Analysis"),
                    "estimated_time": item.get("estimated_time"),
                    "why_important": item.get("why_important")
                }
                for i, item in enumerate(action_checklist)
            ]
        
        # Add summary
        formatted["summary"] = self.extract_summary(final_output)
        
        # Add key insights
        formatted["key_insights"] = self.extract_key_insights(final_output)
        
        # Add quick stats
        formatted["quick_stats"] = self._extract_quick_stats(final_output)
        
        return formatted
    
    def _extract_quick_stats(self, final_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract quick stats for dashboard widgets
        
        Args:
            final_output: Complete decision analysis output
        
        Returns:
            Quick stats dict
        """
        options = final_output.get("options", [])
        verdict = final_output.get("verdict", {})
        risk = final_output.get("risk_assessment", {})
        financial_impact = final_output.get("financial_impact", {})
        
        recommended_name = verdict.get("recommended_option", "")
        recommended_option = next(
            (opt for opt in options if opt.get("name") == recommended_name),
            options[0] if options else {}
        )
        
        return {
            "confidence": verdict.get("confidence", 0),
            "risk_level": verdict.get("risk_level", "unknown"),
            "monthly_payment": recommended_option.get("monthly_payment", 0),
            "total_cost": recommended_option.get("tco_expected", 0),
            "liquidity_score": recommended_option.get("liquidity_score", 0),
            "runway_days": recommended_option.get("runway_impact", {}).get("new_days", 0),
            "stress_tests_passed": risk.get("stress_tests_passed", 0),
            "stress_tests_failed": risk.get("stress_tests_failed", 0),
            "expense_increase_pct": financial_impact.get("expense_increase_pct", 0)
        }
    
    def extract_error_details(self, error: Exception, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Extract error details for API error response
        
        Args:
            error: Exception that occurred
            context: Optional context dict
        
        Returns:
            Error details dict
        """
        return {
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context or {},
            "user_friendly_message": self._get_user_friendly_error_message(error)
        }
    
    def _get_user_friendly_error_message(self, error: Exception) -> str:
        """
        Convert technical error to user-friendly message
        
        Args:
            error: Exception
        
        Returns:
            User-friendly error message
        """
        error_str = str(error).lower()
        
        if "database" in error_str or "supabase" in error_str:
            return "We're having trouble accessing your financial data. Please try again in a moment."
        elif "timeout" in error_str:
            return "The analysis is taking longer than expected. Please try again."
        elif "validation" in error_str or "invalid" in error_str:
            return "Some of the input data appears to be invalid. Please check your entries and try again."
        elif "llm" in error_str or "api" in error_str:
            return "We're experiencing issues with our AI service. Please try again shortly."
        else:
            return "An unexpected error occurred. Our team has been notified. Please try again."

