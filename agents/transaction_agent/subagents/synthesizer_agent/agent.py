"""
Financial Insight Synthesizer Agent

Generates comprehensive, natural language financial insights from merged analysis results.
Combines all agent outputs into actionable recommendations and risk assessments.
Creates human-readable reports that provide clear guidance for financial decisions.

Key functions:
- Synthesizes categorization, fraud, budget, and cashflow insights
- Generates prioritized recommendations with clear reasoning
- Creates executive summaries and detailed analysis
- Formats insights for database storage and user consumption
"""

from typing import AsyncGenerator, Dict, Any
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part
from google.genai import Client

from .prompt import SYNTHESIS_PROMPT
from .tools import (
    create_transaction_summary,
    format_results_for_llm,
    validate_and_enhance_insight,
    create_fallback_insight
)
from ...utils.json_parser import parse_json_response


class SynthesizerAgent(BaseAgent):
    """
    Synthesizer agent that:
    1. Reads merged results from reducer agent
    2. Generates comprehensive financial insights using LLM
    3. Creates actionable recommendations with clear reasoning
    4. Formats output for database storage and user consumption
    5. Writes final insight to session state
    """

    def __init__(self):
        super().__init__(
            name="synthesizer_agent",
            description="Generates comprehensive financial insights from analysis results"
        )

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """Execute insight synthesis with proper state management."""
        
        try:
            # Initialize LLM client
            client = Client()
            model = "gemini-2.5-flash"
            
            # Step 1: Read required data from session state
            merged_results = ctx.session.state.get("merged_results", {})
            incoming_transaction = ctx.session.state.get("incoming_transaction", {})
            user_id = ctx.session.state.get("user_id", "unknown")
            run_id = ctx.session.state.get("run_id", "unknown")
            
            if not merged_results or merged_results.get("error"):
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Error: No merged results found in session state")]),
                    actions=EventActions(state_delta={
                        "final_insight": {"error": "No merged results available"}
                    })
                )
                return
            
            # Step 2: Prepare transaction summary
            transaction_summary = create_transaction_summary(incoming_transaction)
            
            # Step 3: Format merged results for LLM
            formatted_results = format_results_for_llm(merged_results)
            
            # Step 4: Create prompt with context
            prompt = SYNTHESIS_PROMPT.format(
                user_id=user_id,
                transaction_summary=transaction_summary,
                run_id=run_id,
                merged_results=formatted_results
            )
            
            # Step 5: Call LLM for insight generation
            response = await client.aio.models.generate_content(
                model=model,
                contents=prompt
            )
            
            # Step 6: Extract text from response
            llm_response_text = response.text if hasattr(response, 'text') else str(response)
            
            # Step 7: Parse JSON response
            insight_dict = parse_json_response(llm_response_text)
            
            if insight_dict and isinstance(insight_dict, dict):
                # Step 8: Validate and enhance insight structure
                final_insight = validate_and_enhance_insight(insight_dict, merged_results)
                
                # Step 9: Write final insight to state
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text=f"Generated comprehensive financial insight: {final_insight.get('title', 'Analysis Complete')}")]),
                    actions=EventActions(state_delta={
                        "final_insight": final_insight
                    })
                )
            else:
                # Fallback if JSON parsing fails
                fallback_insight = create_fallback_insight(merged_results)
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Generated fallback insight due to parsing issues")]),
                    actions=EventActions(state_delta={
                        "final_insight": fallback_insight
                    })
                )
            
        except Exception as e:
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Synthesizer error: {str(e)}")]),
                actions=EventActions(state_delta={
                    "final_insight": {"error": str(e)}
                })
            )



# Create the agent instance
synthesizer_agent = SynthesizerAgent()
