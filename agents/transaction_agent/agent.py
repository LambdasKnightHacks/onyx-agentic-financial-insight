"""Root agent assembly for the transaction analysis pipeline."""

from google.adk.agents import SequentialAgent, ParallelAgent

from .subagents import (
    init_agent,
    categorization_agent,
    fraud_agent,
    budget_agent,
    cashflow_agent,
    reducer_agent,
    synthesizer_agent,
    database_agent
)


# Parallel Analysis Agent: performs parallel analysis on the transaction
parallel_analysis_agent = ParallelAgent(
    name="parallel_analysis_agent",
    sub_agents=[
        categorization_agent,
        fraud_agent,
        budget_agent,
        cashflow_agent,
    ],
)

# Root Sequential Agent: orchestrates the entire pipeline (optimized - removed consensus agent)
root_agent = SequentialAgent(
    name="transaction_agent",
    sub_agents=[
        init_agent,
        parallel_analysis_agent,
        reducer_agent,
        synthesizer_agent,
        database_agent
    ],
)