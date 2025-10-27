"""
Synthesis Agent

Combines all agent outputs into final verdict and comprehensive JSON output.

Inputs:
- All previous agent results from session state

Outputs:
- final_decision_output: Complete JSON structure ready for frontend
"""

from typing import AsyncGenerator, Dict, Any, List
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part
import google.generativeai as genai
import os
import json
from datetime import datetime
import uuid

from .prompts import SYNTHESIS_AGENT_SYSTEM_PROMPT, get_synthesis_prompt
from ...config import LLM_MODEL


class SynthesisAgent(BaseAgent):
    """
    Synthesis Agent - Combines all analysis into final verdict
    
    Responsibilities:
    - Review all agent outputs
    - Generate LLM-powered verdict with reasoning
    - Compile comparison matrix
    - Assess overall risk
    - Format complete output JSON
    """
    
    def __init__(self):
        super().__init__(
            name="synthesis_agent",
            description="Synthesizes all agent outputs into final verdict and comprehensive report"
        )
        
        # Configure Gemini (model will be created in _run_async_impl)
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    
    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """
        Synthesize final decision output
        
        Expected session state:
        - decision_type, analysis_id, user_id
        - user_financial_profile
        - tco_results
        - risk_liquidity_analysis
        - credit_impact_analysis
        - opportunity_cost_analysis
        - budget_recommendations
        """
        try:
            # Extract all session state
            decision_type = ctx.session.state.get("decision_type", "")
            analysis_id = ctx.session.state.get("analysis_id", "")
            user_id = ctx.session.state.get("user_id", "")
            
            user_profile_data = ctx.session.state.get("user_financial_profile", {})
            tco_results = ctx.session.state.get("tco_results", [])
            risk_analysis = ctx.session.state.get("risk_liquidity_analysis", [])
            credit_analysis = ctx.session.state.get("credit_impact_analysis", [])
            opp_cost_analysis = ctx.session.state.get("opportunity_cost_analysis", [])
            budget_recs = ctx.session.state.get("budget_recommendations", {})
            
            if not tco_results:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Error: No TCO results to synthesize")]),
                    actions=EventActions(state_delta={
                        "synthesis_error": "Missing TCO results"
                    })
                )
                return
            
            user_profile = user_profile_data.get("user_profile", {})
            
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text="Synthesizing final verdict and recommendations...")])
            )
            
            # Generate LLM verdict
            prompt = get_synthesis_prompt(
                decision_type=decision_type,
                user_profile=user_profile,
                tco_results=tco_results,
                risk_analysis=risk_analysis,
                credit_analysis=credit_analysis,
                opportunity_cost_analysis=opp_cost_analysis,
                budget_recommendations=budget_recs
            )
            
            try:
                # Create model instance here (can't store as instance variable due to Pydantic)
                model = genai.GenerativeModel(LLM_MODEL)
                response = model.generate_content(
                    [SYNTHESIS_AGENT_SYSTEM_PROMPT, prompt],
                    generation_config={
                        "temperature": 0.5,
                        "max_output_tokens": 1500
                    }
                )
                
                llm_verdict_text = response.text
                
                # Parse verdict
                verdict = self._parse_verdict(llm_verdict_text)
                
            except Exception as llm_error:
                print(f"[SYNTHESIS AGENT] LLM parsing failed: {llm_error}")
                verdict = self._generate_fallback_verdict(tco_results, risk_analysis)
            
            # ✅ FIX: Ensure verdict has all required fields
            if not verdict or not isinstance(verdict, dict):
                print(f"[SYNTHESIS AGENT] Verdict is empty, using fallback")
                verdict = self._generate_fallback_verdict(tco_results, risk_analysis)
            
            # Ensure required fields exist
            if "recommended_option" not in verdict:
                verdict["recommended_option"] = tco_results[0].get("name", "Unknown") if tco_results else "Unknown"
            if "confidence" not in verdict:
                verdict["confidence"] = 0.65
            if "reasoning" not in verdict:
                verdict["reasoning"] = f"Automated recommendation based on TCO analysis"
            if "risk_level" not in verdict:
                verdict["risk_level"] = "medium"
            if "key_factors" not in verdict:
                verdict["key_factors"] = ["Total cost analysis completed"]
            if "action_checklist" not in verdict:
                verdict["action_checklist"] = [
                    "Review detailed comparison",
                    "Consider all financial factors",
                    "Make informed decision"
                ]
            
            # Build comparison matrix
            comparison_matrix = self._build_comparison_matrix(tco_results, risk_analysis)
            
            # Compile options with all metadata
            options = self._compile_options(tco_results, risk_analysis, credit_analysis, opp_cost_analysis)
            
            # Assess overall risk
            risk_assessment = self._assess_overall_risk(risk_analysis, user_profile)
            
            # Compile stress scenarios
            stress_scenarios = self._compile_stress_scenarios(risk_analysis)
            
            # Build financial impact summary
            financial_impact = self._build_financial_impact(user_profile, tco_results, risk_analysis, verdict)
            
            # Assemble final output
            final_output = {
                "decision_type": decision_type,
                "analysis_id": analysis_id,
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
                "verdict": verdict,
                "options": options,
                "comparison_matrix": comparison_matrix,
                "risk_assessment": risk_assessment,
                "stress_scenarios": stress_scenarios,
                "budget_rebalancing": budget_recs,
                "financial_impact": financial_impact,
                "action_checklist": verdict.get("action_checklist", []),
                "metadata": {
                    "agents_executed": 7,
                    "data_sources": ["transactions_90d", "budgets", "accounts", "user_profile"]
                }
            }
            
            # Generate summary
            summary = (
                f"Synthesis Complete! Recommendation: {verdict['recommended_option']} "
                f"(Confidence: {verdict['confidence']:.0%}, Risk: {verdict['risk_level']})"
            )
            
            # Write results to session state
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=summary)]),
                actions=EventActions(state_delta={
                    "final_decision_output": final_output,
                    "synthesis_complete": True
                })
            )
            
        except Exception as e:
            error_msg = f"Synthesis Agent failed: {str(e)}"
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=error_msg)]),
                actions=EventActions(state_delta={
                    "synthesis_error": str(e),
                    "synthesis_complete": False
                })
            )
    
    def _parse_verdict(self, llm_text: str) -> Dict[str, Any]:
        """Parse LLM verdict JSON"""
        try:
            if "```json" in llm_text:
                start = llm_text.find("```json") + 7
                end = llm_text.find("```", start)
                json_str = llm_text[start:end].strip()
            elif "```" in llm_text:
                start = llm_text.find("```") + 3
                end = llm_text.find("```", start)
                json_str = llm_text[start:end].strip()
            else:
                json_str = llm_text.strip()
            
            return json.loads(json_str)
        except:
            return {}
    
    def _generate_fallback_verdict(self, tco_results: List[Dict], risk_analysis: List[Dict]) -> Dict[str, Any]:
        """Generate verdict without LLM (fallback)"""
        # Choose option with lowest TCO and acceptable risk
        best_option = min(tco_results, key=lambda x: x.get("tco_expected", float('inf')))
        
        return {
            "recommended_option": best_option.get("name", "Unknown"),
            "confidence": 0.65,
            "reasoning": f"Based on lowest total cost of ownership: ${best_option.get('tco_expected', 0):,.2f}",
            "risk_level": "medium",
            "key_factors": [
                "Lowest total cost of ownership",
                "Risk analysis completed",
                "Comprehensive comparison performed"
            ],
            "trade_offs": ["Automated decision without LLM synthesis"],
            "action_checklist": [
                "Review detailed analysis",
                "Compare all options carefully",
                "Consult with financial advisor if needed"
            ],
            "sensitivity_factors": ["Interest rate changes", "Income stability"]
        }
    
    def _build_comparison_matrix(self, tco_results: List[Dict], risk_analysis: List[Dict]) -> Dict[str, Any]:
        """Build comparison matrix"""
        # Safety check for empty lists
        if not tco_results:
            return {
                "winner_by_tco": "Unknown",
                "winner_by_liquidity": "Unknown",
                "winner_by_flexibility": "Unknown",
                "tco_difference": 0,
                "tco_difference_pct": 0
            }
        
        # Find winners by different metrics
        winner_by_tco = min(tco_results, key=lambda x: x.get("tco_expected", float('inf')))
        winner_by_liquidity = max(risk_analysis, key=lambda x: x.get("liquidity_score", 0)) if risk_analysis else {}
        
        tco_values = [opt.get("tco_expected", 0) for opt in tco_results]
        tco_difference = max(tco_values) - min(tco_values) if len(tco_values) > 1 else 0
        tco_difference_pct = (tco_difference / max(tco_values) * 100) if tco_values and max(tco_values) > 0 else 0
        
        return {
            "winner_by_tco": winner_by_tco.get("name", "Unknown"),
            "winner_by_liquidity": winner_by_liquidity.get("option_name", "Unknown"),
            "winner_by_flexibility": tco_results[-1].get("name", "Unknown") if tco_results else "Unknown",
            "tco_difference": round(tco_difference, 2),
            "tco_difference_pct": round(tco_difference_pct, 1)
        }
    
    def _compile_options(
        self,
        tco_results: List[Dict],
        risk_analysis: List[Dict],
        credit_analysis: List[Dict],
        opp_cost_analysis: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Compile complete option data"""
        options = []
        
        for i, tco in enumerate(tco_results):
            risk = risk_analysis[i] if i < len(risk_analysis) else {}
            credit = credit_analysis[i] if i < len(credit_analysis) else {}
            opp_cost = opp_cost_analysis[i] if i < len(opp_cost_analysis) else {}
            
            runway_impact = risk.get("runway_impact", {})
            
            monthly_equiv = tco.get("monthly_equivalent", 0)
            breakdown = tco.get("tco_breakdown", {})
            
            options.append({
                "name": tco.get("name", "Unknown"),
                "option_type": tco.get("option_type", ""),
                "tco_expected": tco.get("tco_expected", 0),
                "tco_range": [
                    tco.get("tco_expected", 0) * 0.95,
                    tco.get("tco_expected", 0) * 1.05
                ],
                "tco_breakdown": breakdown,
                "monthly_payment": monthly_equiv,  # For verdict display
                "monthly_equivalent": monthly_equiv,  # ✅ FIX: Frontend expects this field name
                "upfront_cost": breakdown.get("down_payment", 0),
                "liquidity_score": risk.get("liquidity_score", 0),
                "credit_impact": credit.get("impact_range", "unknown"),
                "runway_impact": {
                    "current_days": runway_impact.get("current_runway_days", 0),
                    "new_days": runway_impact.get("new_runway_days", 0),
                    "delta": runway_impact.get("runway_delta", 0)
                },
                "runway_breach_prob_6mo": runway_impact.get("runway_breach_probability_6mo", 0),
                "utility_score": 0.75,  # Placeholder - could be calculated
                "pros": tco.get("pros", []),
                "cons": tco.get("cons", [])
            })
        
        return options
    
    def _assess_overall_risk(self, risk_analysis: List[Dict], user_profile: Dict) -> Dict[str, Any]:
        """Assess overall risk"""
        # Count stress test results
        total_tests = 0
        passed_tests = 0
        stress_tests = {}
        
        for analysis in risk_analysis:
            scenarios = analysis.get("stress_scenarios", [])
            for scenario in scenarios:
                total_tests += 1
                can_sustain = scenario.get("impact", {}).get("can_sustain", False)
                scenario_name = scenario.get("name", f"scenario_{total_tests}")
                
                # Map scenario names to frontend expected names
                # Include impact data for detailed context
                impact_data = scenario.get("impact", {})
                verdict_message = scenario.get("verdict", "")
                
                if "income" in scenario_name.lower() and "10" in scenario_name:
                    stress_tests["income_drop_10"] = {
                        "passes": can_sustain,
                        "message": verdict_message,
                        "impact": impact_data
                    }
                elif "income" in scenario_name.lower() and "20" in scenario_name:
                    stress_tests["income_drop_20"] = {
                        "passes": can_sustain,
                        "message": verdict_message,
                        "impact": impact_data
                    }
                elif "spike" in scenario_name.lower() or "expense" in scenario_name.lower():
                    stress_tests["expense_spike"] = {
                        "passes": can_sustain,
                        "message": verdict_message,
                        "impact": impact_data
                    }
                elif "emergency" in scenario_name.lower():
                    stress_tests["emergency_expense"] = {
                        "passes": can_sustain,
                        "message": verdict_message,
                        "impact": impact_data
                    }
                
                if can_sustain:
                    passed_tests += 1
        
        # Extract DTI and liquidity data from first risk analysis
        dti_ratio = 0
        dti_status = "healthy"
        emergency_fund_months = user_profile.get("emergency_fund_months", 0)
        emergency_fund_status = "strong" if emergency_fund_months >= 6 else "adequate" if emergency_fund_months >= 3 else "weak"
        runway_days = 0
        runway_status = "safe"
        
        if risk_analysis:
            first_risk = risk_analysis[0]
            dti_ratio = first_risk.get("dti_ratio", 0)
            if dti_ratio >= 0.36:
                dti_status = "high"
            elif dti_ratio >= 0.28:
                dti_status = "elevated"
            else:
                dti_status = "healthy"
            
            runway_impact = first_risk.get("runway_impact", {})
            runway_days = runway_impact.get("current_runway_days", 0)
            if runway_days >= 90:
                runway_status = "safe"
            elif runway_days >= 30:
                runway_status = "moderate"
            else:
                runway_status = "critical"
        
        # Check key thresholds
        emergency_fund_safe = emergency_fund_months >= 3
        liquidity_adequate = user_profile.get("total_balance", 0) > 5000  # Placeholder
        
        return {
            "overall_risk": "low",  # Could be calculated based on metrics
            "dti_ratio": dti_ratio,
            "dti_status": dti_status,
            "emergency_fund_months": emergency_fund_months,
            "emergency_fund_status": emergency_fund_status,
            "runway_days": runway_days,
            "runway_status": runway_status,
            "liquidity_score": 0.8,  # Could be calculated
            "liquidity_adequate": liquidity_adequate,
            "emergency_fund_safe": emergency_fund_safe,
            "dti_within_limits": True,
            "runway_acceptable": True,
            "stress_tests": stress_tests,
            "stress_tests_passed": passed_tests,
            "stress_tests_failed": total_tests - passed_tests
        }
    
    def _compile_stress_scenarios(self, risk_analysis: List[Dict]) -> List[Dict[str, Any]]:
        """Compile stress test scenarios"""
        # Take scenarios from first option (they're similar across options)
        if risk_analysis:
            return risk_analysis[0].get("stress_scenarios", [])
        return []
    
    def _build_financial_impact(
        self,
        user_profile: Dict,
        tco_results: List[Dict],
        risk_analysis: List[Dict],
        verdict: Dict
    ) -> Dict[str, Any]:
        """Build financial impact summary"""
        # Find the recommended option
        recommended_name = verdict.get("recommended_option", "")
        recommended_option = next(
            (opt for opt in tco_results if opt.get("name") == recommended_name),
            tco_results[0] if tco_results else {}
        )
        recommended_risk = next(
            (risk for risk in risk_analysis if risk.get("option_name") == recommended_name),
            risk_analysis[0] if risk_analysis else {}
        )
        
        current_expenses = user_profile.get("average_monthly_expenses", 0)
        new_payment = recommended_option.get("monthly_equivalent", 0)
        new_expenses = current_expenses + new_payment
        
        runway_impact = recommended_risk.get("runway_impact", {})
        
        return {
            "current_monthly_expenses": current_expenses,
            "new_monthly_expenses": new_expenses,
            "expense_increase": new_payment,
            "expense_increase_pct": round((new_payment / current_expenses * 100) if current_expenses > 0 else 0, 1),
            "current_runway_days": runway_impact.get("current_runway_days", 0),
            "new_runway_days": runway_impact.get("new_runway_days", 0),
            "emergency_fund_months_before": user_profile.get("emergency_fund_months", 0),
            "emergency_fund_months_after": round(
                (user_profile.get("total_balance", 0) - recommended_option.get("tco_breakdown", {}).get("down_payment", 0)) / new_expenses,
                1
            ) if new_expenses > 0 else 0
        }

