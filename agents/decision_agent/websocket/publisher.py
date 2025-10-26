"""
WebSocket Publisher for Decision Analysis

Publishes real-time updates during decision analysis pipeline execution.
Similar to transaction agent WebSocket streaming but with decision-specific events.
"""

from datetime import datetime
from typing import Dict, Any, Optional
import json


class DecisionWebSocketPublisher:
    """
    Publishes decision analysis events to WebSocket clients
    
    Event Types:
    - decision_analysis_started: Analysis begins
    - agent_started: Individual agent begins processing
    - agent_progress: Intermediate updates from agent
    - agent_completed: Agent finishes with results
    - decision_analysis_complete: Final results ready
    - error: Error occurred during analysis
    """
    
    def __init__(self, websocket_manager):
        """
        Initialize publisher with WebSocket manager
        
        Args:
            websocket_manager: WebSocketManager instance from main app
        """
        self.websocket_manager = websocket_manager
        self.agent_display_names = {
            "data_fusion_agent": "Analyzing Financial Profile",
            "tco_calculator_agent": "Calculating Total Cost of Ownership",
            "risk_liquidity_agent": "Assessing Financial Risk & Liquidity",
            "credit_impact_agent": "Estimating Credit Score Impact",
            "opportunity_cost_agent": "Analyzing Investment Opportunities",
            "behavioral_coach_agent": "Generating Budget Recommendations",
            "synthesis_agent": "Creating Final Verdict"
        }
        self.agent_descriptions = {
            "data_fusion_agent": "Enriching your financial context from transaction history, budgets, and spending patterns",
            "tco_calculator_agent": "Computing comprehensive cost breakdowns for each option",
            "risk_liquidity_agent": "Running stress tests and calculating runway impact",
            "credit_impact_agent": "Simulating credit score changes and recovery timeline",
            "opportunity_cost_agent": "Comparing alternative uses of your money",
            "behavioral_coach_agent": "Creating personalized, realistic budget adjustments",
            "synthesis_agent": "Combining all analyses into a clear recommendation"
        }
    
    async def publish_analysis_started(
        self,
        session_id: str,
        decision_type: str,
        user_id: str,
        analysis_id: str
    ):
        """
        Publish event when decision analysis starts
        
        Args:
            session_id: Session ID for WebSocket routing
            decision_type: Type of decision being analyzed
            user_id: User ID
            analysis_id: Analysis record ID
        """
        message = {
            "type": "analysis_started",  # ✅ FIX: Match frontend expectation
            "timestamp": datetime.now().isoformat(),
            "data": {
                "session_id": session_id,
                "analysis_id": analysis_id,
                "user_id": user_id,
                "decision_type": decision_type,
                "decision_type_display": decision_type.replace("_", " ").title(),
                "message": f"Starting {decision_type.replace('_', ' ').title()} analysis...",
                "total_steps": 7,
                "current_step": 0
            }
        }
        await self._send_message(session_id, message)
    
    async def publish_agent_started(
        self,
        session_id: str,
        agent_name: str,
        step_number: int,
        total_steps: int = 7
    ):
        """
        Publish event when an agent starts processing
        
        Args:
            session_id: Session ID for WebSocket routing
            agent_name: Name of the agent starting
            step_number: Current step number (1-7)
            total_steps: Total number of steps (default 7)
        """
        display_name = self.agent_display_names.get(agent_name, agent_name)
        description = self.agent_descriptions.get(agent_name, "Processing...")
        
        message = {
            "type": "agent_started",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "session_id": session_id,
                "agent_name": agent_name,
                "agent_display_name": display_name,
                "description": description,
                "step": step_number,
                "total_steps": total_steps,
                "message": display_name,
                "progress_pct": int(((step_number - 1) / total_steps) * 100)
            }
        }
        await self._send_message(session_id, message)
    
    async def publish_agent_progress(
        self,
        session_id: str,
        agent_name: str,
        progress_message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Publish intermediate progress update from an agent
        
        Args:
            session_id: Session ID for WebSocket routing
            agent_name: Name of the agent
            progress_message: Human-readable progress message
            details: Optional additional details
        """
        message = {
            "type": "agent_progress",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "session_id": session_id,
                "agent_name": agent_name,
                "message": progress_message,
                "details": details or {}
            }
        }
        await self._send_message(session_id, message)
    
    async def publish_agent_completed(
        self,
        session_id: str,
        agent_name: str,
        step_number: int,
        summary: Optional[str] = None,
        key_insights: Optional[list] = None
    ):
        """
        Publish event when an agent completes successfully
        
        Args:
            session_id: Session ID for WebSocket routing
            agent_name: Name of the completed agent
            step_number: Step number that just completed
            summary: Optional summary of results
            key_insights: Optional list of key insights
        """
        display_name = self.agent_display_names.get(agent_name, agent_name)
        
        message = {
            "type": "agent_completed",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "session_id": session_id,
                "agent_name": agent_name,
                "agent_display_name": display_name,
                "step": step_number,
                "summary": summary or f"{display_name} completed successfully",
                "key_insights": key_insights or [],
                "status": "completed"
            }
        }
        await self._send_message(session_id, message)
    
    async def publish_analysis_complete(
        self,
        session_id: str,
        analysis_id: str,
        final_result: Dict[str, Any],
        processing_time_seconds: float
    ):
        """
        Publish event when entire decision analysis is complete
        
        Args:
            session_id: Session ID for WebSocket routing
            analysis_id: Analysis record ID
            final_result: Complete decision analysis output JSON
            processing_time_seconds: Total processing time
        """
        message = {
            "type": "analysis_complete",  # ✅ FIX: Match frontend expectation
            "timestamp": datetime.now().isoformat(),
            "data": {
                "session_id": session_id,
                "analysis_id": analysis_id,
                "processing_time_seconds": round(processing_time_seconds, 2),
                "message": "Decision analysis complete!",
                "final_result": final_result,  # ✅ FIX: Frontend expects final_result
                "status": "completed"
            }
        }
        await self._send_message(session_id, message)
    
    async def publish_error(
        self,
        session_id: str,
        error_message: str,
        agent_name: Optional[str] = None,
        error_details: Optional[Dict[str, Any]] = None
    ):
        """
        Publish error event
        
        Args:
            session_id: Session ID for WebSocket routing
            error_message: Human-readable error message
            agent_name: Optional name of agent where error occurred
            error_details: Optional additional error details
        """
        message = {
            "type": "error",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "session_id": session_id,
                "agent_name": agent_name,
                "error_message": error_message,
                "error_details": error_details or {},
                "status": "failed"
            }
        }
        await self._send_message(session_id, message)
    
    async def _send_message(self, session_id: str, message: Dict[str, Any]):
        """
        Internal method to send message via WebSocket manager
        
        Args:
            session_id: Session ID for routing
            message: Message dict to send
        """
        try:
            print(f"[WEBSOCKET PUBLISHER] Sending message type '{message.get('type')}' to session {session_id}")
            await self.websocket_manager.send_to_session(session_id, message)
            print(f"[WEBSOCKET PUBLISHER] Successfully sent message to session {session_id}")
        except Exception as e:
            # Log but don't raise - WebSocket errors shouldn't break analysis
            print(f"[WEBSOCKET PUBLISHER] ERROR sending to session {session_id}: {e}")
            import traceback
            traceback.print_exc()
    
    def extract_agent_summary(self, agent_name: str, state_delta: Dict[str, Any]) -> Optional[str]:
        """
        Extract human-readable summary from agent's state delta
        
        Args:
            agent_name: Name of the agent
            state_delta: State delta from agent's EventActions
        
        Returns:
            Human-readable summary string or None
        """
        # Extract key metrics based on agent type
        if agent_name == "data_fusion_agent":
            profile = state_delta.get("user_financial_profile", {}).get("user_profile", {})
            if profile:
                return f"Profile enriched: ${profile.get('total_balance', 0):,.0f} balance, ${profile.get('monthly_income', 0):,.0f} monthly income"
        
        elif agent_name == "tco_calculator_agent":
            results = state_delta.get("tco_results", [])
            if results:
                tco_values = [r.get("tco_expected", 0) for r in results]
                return f"TCO calculated: {len(results)} options analyzed (range: ${min(tco_values):,.0f} - ${max(tco_values):,.0f})"
        
        elif agent_name == "risk_liquidity_agent":
            analyses = state_delta.get("risk_liquidity_analysis", [])
            if analyses:
                avg_liquidity = sum(a.get("liquidity_score", 0) for a in analyses) / len(analyses)
                return f"Risk assessed: Average liquidity score {avg_liquidity:.2f}"
        
        elif agent_name == "credit_impact_agent":
            analyses = state_delta.get("credit_impact_analysis", [])
            if analyses:
                impacts = [a.get("impact_range", "unknown") for a in analyses]
                return f"Credit impact estimated: {', '.join(impacts)}"
        
        elif agent_name == "opportunity_cost_agent":
            analyses = state_delta.get("opportunity_cost_analysis", [])
            if analyses:
                return f"Opportunity costs calculated for {len(analyses)} options"
        
        elif agent_name == "behavioral_coach_agent":
            recs = state_delta.get("budget_recommendations", {})
            total_savings = recs.get("total_monthly_savings", 0)
            if total_savings > 0:
                return f"Budget recommendations: ${total_savings:.0f}/month in potential savings"
        
        elif agent_name == "synthesis_agent":
            output = state_delta.get("final_decision_output", {})
            verdict = output.get("verdict", {})
            if verdict:
                return f"Recommendation: {verdict.get('recommended_option', 'N/A')} (Confidence: {verdict.get('confidence', 0)*100:.0f}%)"
        
        return None

