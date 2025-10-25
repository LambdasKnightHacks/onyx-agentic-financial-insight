"""
A2A System Initialization

Initializes the A2A communication system by registering all agents
and their message handlers.
"""

from .a2a_client import a2a_client
from .agent_cards import get_all_agent_cards


def initialize_a2a_system():
    """Initialize the A2A communication system."""
    print("Initializing A2A communication system...")
    
    # Register all agent cards
    agent_cards = get_all_agent_cards()
    for agent_name, agent_card in agent_cards.items():
        a2a_client.register_agent(agent_name, agent_card)
    
    print(f"A2A system initialized with {len(agent_cards)} agents")
    return a2a_client


# Initialize A2A system when module is imported
initialize_a2a_system()
