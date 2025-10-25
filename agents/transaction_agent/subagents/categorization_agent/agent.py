"""
Transaction Categorization Agent

Automatically categorizes financial transactions using a comprehensive taxonomy.
Analyzes merchant names, descriptions, and transaction metadata to assign:
- Primary category (income, living, food, transportation, shopping, entertainment, travel, healthcare, education, financial)
- Subcategory (e.g., coffee_tea under food, gas_station under transportation)
- Confidence score (0.0-1.0) based on pattern matching strength
- Reasoning explanation for the categorization decision
"""

from typing import AsyncGenerator
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events import Event, EventActions
from google.genai.types import Content, Part
from google.genai import Client

from .prompt import CATEGORIZATION_PROMPT
from ...utils.json_parser import parse_json_response
from ...a2a import a2a_client, CategorizationAgentMessageHandler


class CategorizationAgent(BaseAgent):
    """
    Custom BaseAgent that:
    1. Reads transaction data from session state
    2. Formats it for the LLM  
    3. Parses LLM JSON response
    4. Writes structured dict to session state
    """

    def __init__(self):
        super().__init__(
            name="categorization_agent",
            description="Categorizes transactions and provides merchant verification via A2A"
        )
        
        # Initialize A2A communication
        self._a2a_handler = CategorizationAgentMessageHandler()
        a2a_client.register_message_handler("categorization_agent", self._a2a_handler)

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """Execute categorization with proper state management."""
        
        try:
            # Initialize LLM client
            client = Client()
            model = "gemini-2.5-flash"
            
            # Step 1: Read from session state
            transaction = ctx.session.state.get("incoming_transaction", {})
            user_rules = ctx.session.state.get("user_rules", [])
            
            if not transaction:
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text="Error: No transaction data found in session state")]),
                    actions=EventActions(state_delta={
                        "categorization_result": {"error": "No transaction data"}
                    })
                )
                return
            
            # Step 2: Format input for LLM
            merchant_name = transaction.get("merchant_name", "Unknown")
            description = transaction.get("description", "")
            amount = transaction.get("amount", 0)
            mcc = transaction.get("mcc", "")
            payment_channel = transaction.get("payment_channel", "")
            
            prompt = CATEGORIZATION_PROMPT.format(
                merchant_name=merchant_name,
                description=description,
                amount=amount,
                mcc=mcc,
                payment_channel=payment_channel
            )

            # Step 3: Call LLM directly
            response = await client.aio.models.generate_content(
                model=model,
                contents=prompt
            )
            
            # Extract text from response
            llm_response_text = response.text if hasattr(response, 'text') else str(response)
            
            # Step 4: Parse JSON response
            result_dict = parse_json_response(llm_response_text)
            
            if result_dict and isinstance(result_dict, dict):
                # Step 5: Write structured output to state
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text=f"Categorized as {result_dict.get('category')}/{result_dict.get('subcategory')} with {result_dict.get('confidence', 0):.2f} confidence")]),
                    actions=EventActions(state_delta={
                        "categorization_result": result_dict
                    })
                )
            else:
                # Parsing failed, but still provide text response
                yield Event(
                    author=self.name,
                    content=Content(parts=[Part(text=f"Categorization complete (text response): {llm_response_text[:200]}...")]),
                    actions=EventActions(state_delta={
                        "categorization_result": {
                            "raw_response": llm_response_text,
                            "error": "Failed to parse JSON"
                        }
                    })
                )
                
        except Exception as e:
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text=f"Categorization error: {str(e)}")]),
                actions=EventActions(state_delta={
                    "categorization_result": {"error": str(e)}
                })
            )

# Create the agent instance
categorization_agent = CategorizationAgent()

