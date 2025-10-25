""" Root agent assembly for the transaction analysis pipeline """

from google.adk.agents import SequentialAgent

from .subagents.init_agent import init_agent

# Root Sequential Agent that orchestrates the entire pipeline

root_agent = SequentialAgent(
    name="transaction_agent",
    sub_agents=[
        init_agent,
        # parallel_analysis_agent,
        # a2a_communication_agent,
        # reducer_phase_agent,
        # report_synthesizer_agent,
        # database_agent
    ],
)