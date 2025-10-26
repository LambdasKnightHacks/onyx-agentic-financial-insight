"""
Root Decision Agent

Orchestrates the entire financial decision analysis pipeline.

Pipeline:
1. Data Fusion Agent - Enrich financial context
2. TCO Calculator Agent - Calculate total cost of ownership
3. Risk & Liquidity Agent - Assess financial risk
4. Credit Impact Agent - Simulate credit score impact
5. Opportunity Cost Agent - Analyze alternative uses of money
6. Behavioral Coach Agent - Generate budget recommendations
7. Synthesis Agent - Produce final verdict

All agents run sequentially, each adding their results to session state.
"""

from google.adk.agents import SequentialAgent

from .subagents.data_fusion_agent.agent import DataFusionAgent
from .subagents.tco_calculator_agent.agent import TCOCalculatorAgent
from .subagents.risk_liquidity_agent.agent import RiskLiquidityAgent
from .subagents.credit_impact_agent.agent import CreditImpactAgent
from .subagents.opportunity_cost_agent.agent import OpportunityCostAgent
from .subagents.behavioral_coach_agent.agent import BehavioralCoachAgent
from .subagents.synthesis_agent.agent import SynthesisAgent


def create_decision_agent():
    """
    Create the root decision agent with all sub-agents
    
    Returns:
        SequentialAgent: Configured decision analysis pipeline
    """
    # Create all sub-agents
    data_fusion_agent = DataFusionAgent()
    tco_calculator_agent = TCOCalculatorAgent()
    risk_liquidity_agent = RiskLiquidityAgent()
    credit_impact_agent = CreditImpactAgent()
    opportunity_cost_agent = OpportunityCostAgent()
    behavioral_coach_agent = BehavioralCoachAgent()
    synthesis_agent = SynthesisAgent()
    
    # Assemble into sequential pipeline
    root_agent = SequentialAgent(
        name="decision_agent",  # Name matches directory name
        description="Comprehensive financial decision analysis system",
        sub_agents=[
            data_fusion_agent,
            tco_calculator_agent,
            risk_liquidity_agent,
            credit_impact_agent,
            opportunity_cost_agent,
            behavioral_coach_agent,
            synthesis_agent
        ]
    )
    
    return root_agent


# Export the agent instance (ADK convention: use 'root_agent' as variable name)
root_agent = create_decision_agent()

