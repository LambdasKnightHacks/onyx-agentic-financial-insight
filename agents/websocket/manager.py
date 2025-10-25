"""
WebSocket Connection Manager

Manages WebSocket connections, user sessions, and active analysis sessions.
Handles connection lifecycle and message routing.
"""

from typing import Dict, Set, Any
import json
import asyncio
from fastapi import WebSocket
from datetime import datetime

class WebSocketManager:
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Store analysis sessions by session_id
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        # Note: websocket should already be accepted before calling this method
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        if user_id in self.active_connections:
            disconnected = set()
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_json(message)
                except:
                    disconnected.add(websocket)
            
            # Clean up disconnected websockets
            for ws in disconnected:
                self.active_connections[user_id].discard(ws)
    
    def register_session(self, session_id: str, user_id: str, transaction_data: Dict[str, Any]):
        self.active_sessions[session_id] = {
            "user_id": user_id,
            "transaction": transaction_data,
            "started_at": datetime.now().isoformat(),
            "agents_completed": set(),
            "status": "running"
        }
    
    def update_session(self, session_id: str, agent_name: str, result: Dict[str, Any]):
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["agents_completed"].add(agent_name)
            self.active_sessions[session_id][f"{agent_name}_result"] = result
    
    def complete_session(self, session_id: str, final_result: Dict[str, Any]):
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["status"] = "completed"
            self.active_sessions[session_id]["final_result"] = final_result
            self.active_sessions[session_id]["completed_at"] = datetime.now().isoformat()

# Global WebSocket manager instance
websocket_manager = WebSocketManager()
