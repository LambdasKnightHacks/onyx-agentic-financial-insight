"""
WebSocket Message Models

Pydantic models for WebSocket message structure and validation.
"""

from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

class WebSocketMessage(BaseModel):
    type: str  # "agent_started", "agent_completed", "agent_error", "analysis_complete", "error"
    timestamp: str
    data: Dict[str, Any]

class AgentResult(BaseModel):
    agent_name: str
    status: str  # "processing", "completed", "error"
    result: Optional[Dict[str, Any]] = None
    message: str
    processing_time_ms: Optional[int] = None
    ui_data: Optional[Dict[str, Any]] = None  # Frontend-specific data

class AnalysisSession(BaseModel):
    session_id: str
    user_id: str
    transaction: Dict[str, Any]
    started_at: str
    agents_completed: set
    status: str
