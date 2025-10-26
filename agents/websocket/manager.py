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
        # Store active connections by session_id (for decision analysis)
        self.session_connections: Dict[str, WebSocket] = {}
        # Store analysis sessions by session_id
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        # Note: websocket should already be accepted before calling this method
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
    
    async def connect_session(self, websocket: WebSocket, session_id: str):
        """Connect a WebSocket by session_id (for decision analysis)"""
        # Note: websocket should already be accepted before calling this method
        self.session_connections[session_id] = websocket
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    def disconnect_session(self, session_id: str):
        """Disconnect a WebSocket by session_id"""
        if session_id in self.session_connections:
            del self.session_connections[session_id]
    
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
    
    async def send_to_session(self, session_id: str, message: Dict[str, Any]):
        """Send message to a specific session (for decision analysis)"""
        print(f"[WEBSOCKET MANAGER] Attempting to send to session {session_id}")
        print(f"[WEBSOCKET MANAGER] Active session connections: {list(self.session_connections.keys())}")
        
        if session_id in self.session_connections:
            websocket = self.session_connections[session_id]
            try:
                print(f"[WEBSOCKET MANAGER] Sending message type '{message.get('type')}' to session {session_id}")
                await websocket.send_json(message)
                print(f"[WEBSOCKET MANAGER] Successfully sent message to session {session_id}")
            except Exception as e:
                print(f"[WEBSOCKET MANAGER] Error sending to session {session_id}: {e}")
                import traceback
                traceback.print_exc()
                # Clean up dead connection
                self.disconnect_session(session_id)
        else:
            print(f"[WEBSOCKET MANAGER] WARNING: Session {session_id} not found in connections!")
            print(f"[WEBSOCKET MANAGER] Cannot send message type '{message.get('type')}'")
    
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
