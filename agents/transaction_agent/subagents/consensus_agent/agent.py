"""
A2A Consensus Agent

Builds consensus between agents and resolves conflicts through A2A communication.
Analyzes results from all parallel agents to identify conflicts and coordinate
multi-agent collaboration for improved decision-making.

Key functions:
- Detects conflicts between agent results
- Coordinates A2A communication for conflict resolution
- Builds consensus from multiple agent perspectives
- Provides unified decision-making with confidence scores
- Enables pattern learning and knowledge sharing between agents
"""

from typing import AsyncGenerator, Dict, Any, List
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part

from ...a2a import a2a_client
from .tools import (
    detect_conflicts,
    build_consensus_from_responses,
    calculate_consensus_confidence,
    facilitate_pattern_learning,
    create_consensus_data
)


class ConsensusAgent(BaseAgent):
    """
    Consensus agent that:
    1. Reads results from all parallel analysis agents
    2. Detects conflicts between agent results
    3. Coordinates A2A communication for conflict resolution
    4. Builds consensus from multiple agent perspectives
    5. Writes consensus results to session state
    """

    def __init__(self):
        super().__init__(
            name="consensus_agent",
            description="Builds consensus between agents and resolves conflicts via A2A"
        )

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """Execute consensus building with A2A communication."""
        
        try:
            # Step 1: Read all agent results from session state
            categorization_result = ctx.session.state.get("categorization_result", {})
            fraud_result = ctx.session.state.get("fraud_result", {})
            budget_result = ctx.session.state.get("budget_result", {})
            cashflow_result = ctx.session.state.get("cashflow_result", {})
            
            # Step 2: Detect conflicts between agents
            conflicts = detect_conflicts(
                categorization_result,
                fraud_result,
                budget_result,
                cashflow_result
            )
            
            # Step 3: Resolve conflicts through A2A communication
            resolved_conflicts = []
            for conflict in conflicts:
                resolution = await self._resolve_conflict_via_a2a(conflict)
                if resolution:
                    resolved_conflicts.append(resolution)
            
            # Step 4: Enable pattern learning between agents
            pattern_insights = await facilitate_pattern_learning(
                categorization_result,
                fraud_result,
                budget_result,
                cashflow_result
            )
            
            # Step 5: Create consensus data
            consensus_data = create_consensus_data(conflicts, resolved_conflicts, pattern_insights)
            
            # Step 6: Write consensus results to state
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Consensus building complete: {consensus_data['conflicts_resolved']}/{consensus_data['conflicts_detected']} conflicts resolved")]),
                actions=EventActions(state_delta={
                    "consensus_result": consensus_data
                })
            )
            
        except Exception as e:
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Consensus agent error: {str(e)}")]),
                actions=EventActions(state_delta={
                    "consensus_result": {"error": str(e)}
                })
            )

    def _detect_conflicts(self, categorization: Dict, fraud: Dict, budget: Dict, cashflow: Dict) -> List[Dict[str, Any]]:
        """Detect conflicts between agent results."""
        conflicts = []
        
        # Conflict 1: Fraud vs Categorization
        fraud_score = fraud.get("fraud_score", 0.0)
        categorization_confidence = categorization.get("confidence", 0.0)
        
        if fraud_score > 0.7 and categorization_confidence < 0.5:
            conflicts.append({
                "type": "fraud_vs_categorization",
                "description": "High fraud score conflicts with low categorization confidence",
                "signals": {
                    "fraud_score": fraud_score,
                    "categorization_confidence": categorization_confidence
                },
                "involved_agents": ["fraud_agent", "categorization_agent"],
                "severity": "high"
            })
        elif fraud_score < 0.3 and categorization_confidence > 0.8:
            conflicts.append({
                "type": "fraud_vs_categorization",
                "description": "Low fraud score conflicts with high categorization confidence",
                "signals": {
                    "fraud_score": fraud_score,
                    "categorization_confidence": categorization_confidence
                },
                "involved_agents": ["fraud_agent", "categorization_agent"],
                "severity": "medium"
            })
        
        # Conflict 2: Budget vs Cashflow
        budget_over = budget.get("over_budget", False)
        cashflow_runway = cashflow.get("runway_days", 0)
        
        if budget_over and cashflow_runway > 90:
            conflicts.append({
                "type": "budget_vs_cashflow",
                "description": "Over budget but healthy cashflow runway",
                "signals": {
                    "over_budget": budget_over,
                    "runway_days": cashflow_runway
                },
                "involved_agents": ["budget_agent", "cashflow_agent"],
                "severity": "medium"
            })
        
        return conflicts

    async def _resolve_conflict_via_a2a(self, conflict: Dict[str, Any]) -> Dict[str, Any]:
        """Resolve conflict through A2A communication."""
        conflict_type = conflict["type"]
        involved_agents = conflict["involved_agents"]
        
        # Send conflict resolution request to involved agents
        clarification_request = {
            "type": "conflict_resolution",
            "conflict_type": conflict_type,
            "conflicting_signals": conflict["signals"],
            "context": "consensus_building"
        }
        
        agent_responses = []
        for agent in involved_agents:
            response = await a2a_client.send_message(
                from_agent="consensus_agent",
                to_agent=agent,
                message=clarification_request
            )
            if response:
                agent_responses.append({
                    "agent": agent,
                    "response": response
                })
        
        # Build consensus from responses
        if agent_responses:
            resolution = build_consensus_from_responses(agent_responses, conflict)
            return resolution
        
        return None



# Create the agent instance
consensus_agent = ConsensusAgent()
