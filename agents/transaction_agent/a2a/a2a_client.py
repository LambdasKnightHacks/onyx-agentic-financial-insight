"""
A2A Client Integration

Provides A2A communication capabilities for the transaction analysis pipeline.
Handles agent registration, message sending, and response processing.
"""

from typing import Dict, Any, Optional, List
import asyncio
import json
from datetime import datetime


class A2AClient:
    """Simplified A2A client for transaction analysis agents."""
    
    def __init__(self):
        self.registered_agents = {}
        self.message_handlers = {}
        self.message_history = []
    
    def register_agent(self, agent_name: str, agent_info: Dict[str, Any]):
        """Register an agent with the A2A system."""
        self.registered_agents[agent_name] = {
            "name": agent_name,
            "info": agent_info,
            "registered_at": datetime.now().isoformat(),
            "status": "active"
        }
        print(f"A2A: Registered agent '{agent_name}'")
    
    async def send_message(self, from_agent: str, to_agent: str, message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Send an A2A message between agents."""
        if to_agent not in self.registered_agents:
            print(f"A2A: Error - Agent '{to_agent}' not registered")
            return None
        
        # Create message record
        message_id = f"msg_{len(self.message_history)}_{datetime.now().strftime('%H%M%S')}"
        message_record = {
            "id": message_id,
            "from_agent": from_agent,
            "to_agent": to_agent,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "status": "sent"
        }
        self.message_history.append(message_record)
        
        print(f"A2A: {from_agent} → {to_agent}: {message.get('type', 'unknown')}")
        
        # Process message through handler
        if to_agent in self.message_handlers:
            handler = self.message_handlers[to_agent]
            try:
                response = await handler.handle_message(message)
                message_record["response"] = response
                message_record["status"] = "responded"
                print(f"A2A: {to_agent} → {from_agent}: Response received")
                return response
            except Exception as e:
                message_record["error"] = str(e)
                message_record["status"] = "error"
                print(f"A2A: Error processing message: {e}")
                return None
        
        return None
    
    def register_message_handler(self, agent_name: str, handler):
        """Register a message handler for an agent."""
        self.message_handlers[agent_name] = handler
        print(f"A2A: Registered message handler for '{agent_name}'")
    
    def get_message_history(self, agent_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get message history, optionally filtered by agent."""
        if agent_name:
            return [msg for msg in self.message_history 
                   if msg["from_agent"] == agent_name or msg["to_agent"] == agent_name]
        return self.message_history


class A2AMessageHandler:
    """Base class for A2A message handlers."""
    
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
    
    async def handle_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming A2A message."""
        message_type = message.get("type", "unknown")
        
        if message_type == "merchant_verification":
            return await self.handle_merchant_verification(message)
        elif message_type == "spending_reduction_scenario":
            return await self.handle_scenario_planning(message)
        elif message_type == "conflict_resolution":
            return await self.handle_conflict_resolution(message)
        elif message_type == "fraud_pattern_learning":
            return await self.handle_pattern_learning(message)
        else:
            return {"error": f"Unknown message type: {message_type}"}
    
    async def handle_merchant_verification(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle merchant verification requests."""
        raise NotImplementedError
    
    async def handle_scenario_planning(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle scenario planning requests."""
        raise NotImplementedError
    
    async def handle_conflict_resolution(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle conflict resolution requests."""
        raise NotImplementedError
    
    async def handle_pattern_learning(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle pattern learning requests."""
        raise NotImplementedError


# Global A2A client instance
a2a_client = A2AClient()
