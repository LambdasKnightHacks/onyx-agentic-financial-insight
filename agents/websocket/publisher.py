"""
WebSocket Event Publisher

Publishes agent events to WebSocket clients in real-time.
Handles event formatting and user-specific message routing.
"""

from typing import Dict, Any
import asyncio
from datetime import datetime
from .manager import websocket_manager
from .extractor import AgentResultExtractor

class WebSocketEventPublisher:
    """Publishes agent events to WebSocket clients"""
    
    def __init__(self):
        self.extractor = AgentResultExtractor()
    
    async def publish_agent_started(self, session_id: str, agent_name: str):
        """Publish when an agent starts processing"""
        session_data = websocket_manager.active_sessions.get(session_id)
        if not session_data:
            return
        
        user_id = session_data["user_id"]
        message = {
            "type": "agent_started",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "agent_name": agent_name,
                "session_id": session_id,
                "message": f"{agent_name.replace('_', ' ').title()} started processing..."
            }
        }
        
        await websocket_manager.send_to_user(user_id, message)
    
    async def publish_agent_completed(self, session_id: str, agent_name: str, session_state: Dict[str, Any]):
        """Publish when an agent completes processing"""
        session_data = websocket_manager.active_sessions.get(session_id)
        if not session_data:
            print(f"[PUBLISHER] No session data found for {session_id}")
            return
        
        user_id = session_data["user_id"]
        
        print(f"[PUBLISHER] Publishing agent_completed for {agent_name}")
        print(f"[PUBLISHER] Session state keys: {list(session_state.keys())}")
        
        # Extract agent-specific result
        agent_result = None
        if agent_name == "categorization_agent":
            agent_result = self.extractor.extract_categorization_result(session_state)
        elif agent_name == "fraud_agent":
            agent_result = self.extractor.extract_fraud_result(session_state)
        elif agent_name == "budget_agent":
            agent_result = self.extractor.extract_budget_result(session_state)
        elif agent_name == "cashflow_agent":
            agent_result = self.extractor.extract_cashflow_result(session_state)
        elif agent_name == "synthesizer_agent":
            agent_result = self.extractor.extract_synthesizer_result(session_state)
        
        print(f"[PUBLISHER] Extracted result for {agent_name}: {agent_result}")
        
        if agent_result:
            # Update session data
            websocket_manager.update_session(session_id, agent_name, agent_result["result"])
            
            # Send to client
            message = {
                "type": "agent_completed",
                "timestamp": datetime.now().isoformat(),
                "data": agent_result
            }
            
            await websocket_manager.send_to_user(user_id, message)
    
    async def publish_analysis_complete(self, session_id: str, final_result: Dict[str, Any]):
        """Publish when entire analysis is complete"""
        session_data = websocket_manager.active_sessions.get(session_id)
        if not session_data:
            return
        
        user_id = session_data["user_id"]
        
        # Complete session
        websocket_manager.complete_session(session_id, final_result)
        
        message = {
            "type": "analysis_complete",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "session_id": session_id,
                "run_id": final_result.get("run_id"),
                "insights_id": final_result.get("insights_id"),
                "agents_completed": list(session_data["agents_completed"]),
                "total_processing_time": self._calculate_processing_time(session_data),
                "message": "Transaction analysis completed successfully"
            }
        }
        
        await websocket_manager.send_to_user(user_id, message)
    
    async def publish_error(self, session_id: str, error_message: str, agent_name: str = None):
        """Publish error events"""
        session_data = websocket_manager.active_sessions.get(session_id)
        if not session_data:
            return
        
        user_id = session_data["user_id"]
        message = {
            "type": "error",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "session_id": session_id,
                "agent_name": agent_name,
                "error_message": error_message,
                "message": f"Error in {agent_name or 'analysis'}: {error_message}"
            }
        }
        
        await websocket_manager.send_to_user(user_id, message)
    
    def _calculate_processing_time(self, session_data: Dict[str, Any]) -> float:
        """Calculate total processing time in seconds"""
        started_at = datetime.fromisoformat(session_data["started_at"])
        completed_at = datetime.now()
        return (completed_at - started_at).total_seconds()

# Global publisher instance
websocket_publisher = WebSocketEventPublisher()
