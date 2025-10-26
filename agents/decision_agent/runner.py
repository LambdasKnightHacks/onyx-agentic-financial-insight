"""
Decision Agent Runner

Executes the decision analysis pipeline with ADK Runner and WebSocket streaming.
"""

import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai.types import Content, Part

from .agent import root_agent
from .websocket.publisher import DecisionWebSocketPublisher
from .websocket.extractor import DecisionResultExtractor
from .tools.database import (
    update_decision_analysis_status,
    save_decision_options,
    save_decision_recommendations,
    create_agent_run_record,
    update_agent_run_status
)


class DecisionAnalysisRunner:
    """
    Manages execution of decision analysis pipeline
    """
    
    def __init__(self, websocket_manager):
        """
        Initialize runner with WebSocket manager
        
        Args:
            websocket_manager: WebSocketManager instance
        """
        self.session_service = InMemorySessionService()
        self.websocket_publisher = DecisionWebSocketPublisher(websocket_manager)
        self.result_extractor = DecisionResultExtractor()
        self.agent_order = [
            "data_fusion_agent",
            "tco_calculator_agent",
            "risk_liquidity_agent",
            "credit_impact_agent",
            "opportunity_cost_agent",
            "behavioral_coach_agent",
            "synthesis_agent"
        ]
    
    def _format_options_for_agents(self, decision_type: str, decision_inputs: Dict[str, Any]) -> list:
        """
        Transform decision_inputs into list of options for TCO Calculator Agent
        
        Args:
            decision_type: Type of decision
            decision_inputs: Raw decision inputs from API
        
        Returns:
            List of formatted option dictionaries
        """
        if decision_type == "car_lease_vs_finance":
            # Extract lease and finance options
            lease_option = decision_inputs.get("lease_option", {})
            finance_option = decision_inputs.get("finance_option", {})
            
            options = []
            
            if lease_option:
                options.append({
                    "type": "lease",
                    "name": "Lease",
                    **lease_option
                })
            
            if finance_option:
                options.append({
                    "type": "finance",
                    "name": "Finance",
                    **finance_option
                })
            
            return options
        
        # Add other decision types here as needed
        return []
    
    async def run_analysis(
        self,
        analysis_id: str,
        user_id: str,
        session_id: str,
        decision_type: str,
        decision_inputs: Dict[str, Any],
        preferences: Optional[Dict[str, Any]] = None,
        constraints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Run complete decision analysis pipeline
        
        Args:
            analysis_id: UUID of decision_analyses record
            user_id: User ID
            session_id: Session ID for WebSocket
            decision_type: Type of decision (e.g., "car_lease_vs_finance")
            decision_inputs: Decision-specific input parameters
            preferences: Optional user preferences
            constraints: Optional user constraints
        
        Returns:
            Final decision analysis output dict
        """
        print(f"[DECISION RUNNER] Starting analysis {analysis_id} for user {user_id}")
        start_time = datetime.now()
        
        try:
            # Publish start event
            print(f"[DECISION RUNNER] Publishing analysis_started event to session {session_id}")
            await self.websocket_publisher.publish_analysis_started(
                session_id=session_id,
                decision_type=decision_type,
                user_id=user_id,
                analysis_id=analysis_id
            )
            print(f"[DECISION RUNNER] Start event published successfully")
            
            # ✅ CRITICAL FIX: Wait briefly to allow frontend to connect before starting analysis
            # This prevents race condition where messages are sent before WebSocket is established
            print(f"[DECISION RUNNER] Waiting 2 seconds for frontend WebSocket to connect...")
            await asyncio.sleep(2)
            print(f"[DECISION RUNNER] Resuming analysis...")
            
            # Create ADK session
            print(f"[DECISION RUNNER] Creating ADK session...")
            session = await self.session_service.create_session(
                app_name="decision_analyzer",
                session_id=session_id,
                user_id=user_id
            )
            print(f"[DECISION RUNNER] ADK session created")
            
            # Transform decision_inputs into options format for TCO Calculator
            options = self._format_options_for_agents(decision_type, decision_inputs)
            
            # Set initial state
            initial_state = {
                "analysis_id": analysis_id,
                "user_id": user_id,
                "decision_type": decision_type,
                "decision_inputs": decision_inputs,  # Keep original for reference
                "options": options,  # Formatted for agents
                "preferences": preferences or {},
                "constraints": constraints or {}
            }
            
            session.state.update(initial_state)
            print(f"[DECISION RUNNER] Initial state set: {list(initial_state.keys())}")
            print(f"[DECISION RUNNER] Formatted {len(options)} options for analysis")
            
            # ✅ FIX: Initialize session state properly by sending an Event with state_delta
            from google.adk.events import Event as ADKEvent, EventActions
            init_event = ADKEvent(
                author="system",
                invocation_id=f"init_{session_id}",
                content=Content(parts=[Part(text="Initializing decision analysis")]),
                actions=EventActions(state_delta=initial_state)
            )
            await self.session_service.append_event(session, init_event)
            print(f"[DECISION RUNNER] Initial state written to session via Event")
            
            # Run decision agent pipeline
            print(f"[DECISION RUNNER] Creating ADK Runner with root_agent...")
            runner = Runner(
                app_name="decision_analyzer",
                agent=root_agent,
                session_service=self.session_service
            )
            print(f"[DECISION RUNNER] Starting pipeline execution...")
            
            current_step = 0
            current_agent = None
            agent_start_time = None
            
            for event in runner.run(
                session_id=session_id,
                user_id=user_id,
                new_message=Content(parts=[Part(text="Start decision analysis")])
            ):
                print(f"[DECISION RUNNER] Received event from {event.author}")
                
                # ✅ CRITICAL FIX: Manually apply state_delta to session state
                if hasattr(event, 'actions') and event.actions and hasattr(event.actions, 'state_delta'):
                    state_delta = event.actions.state_delta
                    print(f"[DECISION RUNNER] Applying state_delta with keys: {list(state_delta.keys())}")
                    
                    # ✅ DEBUG: Log actual error messages
                    for key, value in state_delta.items():
                        if 'error' in key and isinstance(value, str):
                            print(f"[DECISION RUNNER ERROR DETAIL] {key}: {value}")
                        session.state[key] = value
                    
                    print(f"[DECISION RUNNER] Session state now has: {list(session.state.keys())}")
                
                # Track which agent is running based on event author
                if event.author != "user" and event.author in self.agent_order:
                    agent_name = event.author
                    
                    # If this is a new agent (not the current one)
                    if agent_name != current_agent:
                        # Complete previous agent if exists
                        if current_agent and agent_start_time:
                            processing_time = (datetime.now() - agent_start_time).total_seconds() * 1000
                            await self._complete_agent(
                                session_id=session_id,
                                analysis_id=analysis_id,
                                agent_name=current_agent,
                                step_number=current_step,
                                session_state=session.state,
                                processing_time_ms=int(processing_time)
                            )
                        
                        # Start new agent
                        current_step += 1
                        current_agent = agent_name
                        agent_start_time = datetime.now()
                        
                        await self.websocket_publisher.publish_agent_started(
                            session_id=session_id,
                            agent_name=agent_name,
                            step_number=current_step,
                            total_steps=len(self.agent_order)
                        )
                        
                        # Create agent run record in database
                        await create_agent_run_record(
                            analysis_id=analysis_id,
                            agent_name=agent_name
                        )
                    
                    # Check for progress updates in event content
                    if event.content and event.content.parts:
                        for part in event.content.parts:
                            if hasattr(part, 'text') and part.text:
                                await self.websocket_publisher.publish_agent_progress(
                                    session_id=session_id,
                                    agent_name=agent_name,
                                    progress_message=part.text
                                )
            
            # Complete final agent
            if current_agent and agent_start_time:
                processing_time = (datetime.now() - agent_start_time).total_seconds() * 1000
                await self._complete_agent(
                    session_id=session_id,
                    analysis_id=analysis_id,
                    agent_name=current_agent,
                    step_number=current_step,
                    session_state=session.state,
                    processing_time_ms=int(processing_time)
                )
            
            # Get final result from session state
            final_output = session.state.get("final_decision_output")
            
            if not final_output:
                raise ValueError("Decision analysis completed but no final output was generated")
            
            # Calculate total processing time
            processing_time_seconds = (datetime.now() - start_time).total_seconds()
            
            # Update database with completion
            await update_decision_analysis_status(
                analysis_id=analysis_id,
                status="completed",
                output_data=final_output,
                processing_time_seconds=processing_time_seconds
            )
            
            # Save options to database
            await save_decision_options(
                analysis_id=analysis_id,
                options=final_output.get("options", [])
            )
            
            # Save budget recommendations to database
            budget_recs = final_output.get("budget_rebalancing", {}).get("recommendations", [])
            if budget_recs:
                await save_decision_recommendations(
                    analysis_id=analysis_id,
                    recommendations=budget_recs
                )
            
            # Format for API response
            formatted_output = self.result_extractor.format_for_api_response(final_output)
            
            # Publish completion event
            await self.websocket_publisher.publish_analysis_complete(
                session_id=session_id,
                analysis_id=analysis_id,
                final_result=formatted_output,
                processing_time_seconds=processing_time_seconds
            )
            
            return formatted_output
        
        except Exception as e:
            # Handle errors
            print(f"[DECISION RUNNER ERROR] Exception occurred: {e}")
            import traceback
            traceback.print_exc()
            
            error_details = self.result_extractor.extract_error_details(e, {
                "analysis_id": analysis_id,
                "decision_type": decision_type
            })
            
            # Update database
            try:
                await update_decision_analysis_status(
                    analysis_id=analysis_id,
                    status="failed",
                    error_message=str(e)
                )
            except Exception as db_error:
                print(f"[DECISION RUNNER ERROR] Failed to update database: {db_error}")
            
            # Publish error
            try:
                await self.websocket_publisher.publish_error(
                    session_id=session_id,
                    error_message=error_details["user_friendly_message"],
                    agent_name=current_agent if 'current_agent' in locals() else "unknown",
                    error_details=error_details
                )
            except Exception as ws_error:
                print(f"[DECISION RUNNER ERROR] Failed to publish error to WebSocket: {ws_error}")
            
            raise
    
    async def _complete_agent(
        self,
        session_id: str,
        analysis_id: str,
        agent_name: str,
        step_number: int,
        session_state: Dict[str, Any],
        processing_time_ms: int
    ):
        """
        Handle agent completion
        
        Args:
            session_id: Session ID
            analysis_id: Analysis record ID
            agent_name: Name of completed agent
            step_number: Step number
            session_state: Current session state
            processing_time_ms: Processing time in milliseconds
        """
        # Extract summary from state
        summary = self.websocket_publisher.extract_agent_summary(agent_name, session_state)
        
        # Extract key insights based on agent
        key_insights = self._extract_agent_insights(agent_name, session_state)
        
        # Publish completion
        await self.websocket_publisher.publish_agent_completed(
            session_id=session_id,
            agent_name=agent_name,
            step_number=step_number,
            summary=summary,
            key_insights=key_insights
        )
        
        # Update agent run record in database
        agent_output = self._extract_agent_output(agent_name, session_state)
        await update_agent_run_status(
            analysis_id=analysis_id,
            agent_name=agent_name,
            status="completed",
            output=agent_output,
            processing_time_ms=processing_time_ms
        )
    
    def _extract_agent_insights(self, agent_name: str, state: Dict[str, Any]) -> list:
        """
        Extract key insights from agent's output
        
        Args:
            agent_name: Name of the agent
            state: Session state
        
        Returns:
            List of insight strings
        """
        insights = []
        
        if agent_name == "risk_liquidity_agent":
            risk_analyses = state.get("risk_liquidity_analysis", [])
            if risk_analyses:
                for analysis in risk_analyses:
                    risk_level = analysis.get("overall_risk", {}).get("overall_risk", "unknown")
                    if risk_level in ["high", "critical"]:
                        insights.append(f"{analysis['option_name']}: {risk_level.upper()} risk level detected")
        
        elif agent_name == "behavioral_coach_agent":
            budget_recs = state.get("budget_recommendations", {})
            recommendations = budget_recs.get("recommendations", [])
            if recommendations:
                # Show top 2 recommendations
                for rec in recommendations[:2]:
                    insights.append(f"Save ${rec.get('monthly_savings', 0)}/mo: {rec.get('specific_change', '')}")
        
        elif agent_name == "synthesis_agent":
            final_output = state.get("final_decision_output", {})
            verdict = final_output.get("verdict", {})
            key_factors = verdict.get("key_factors", [])
            insights.extend(key_factors[:3])
        
        return insights
    
    def _extract_agent_output(self, agent_name: str, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract agent's output for database storage
        
        Args:
            agent_name: Name of the agent
            state: Session state
        
        Returns:
            Agent output dict
        """
        # Map agent names to their state keys
        state_keys = {
            "data_fusion_agent": ["user_financial_profile", "enriched_financial_context"],
            "tco_calculator_agent": ["tco_results"],
            "risk_liquidity_agent": ["risk_liquidity_analysis"],
            "credit_impact_agent": ["credit_impact_analysis"],
            "opportunity_cost_agent": ["opportunity_cost_analysis"],
            "behavioral_coach_agent": ["budget_recommendations"],
            "synthesis_agent": ["final_decision_output"]
        }
        
        keys = state_keys.get(agent_name, [])
        output = {}
        
        for key in keys:
            if key in state:
                output[key] = state[key]
        
        return output


# Global runner instance (will be initialized in main.py)
decision_runner: Optional[DecisionAnalysisRunner] = None


def initialize_runner(websocket_manager):
    """
    Initialize the global decision runner instance
    
    Args:
        websocket_manager: WebSocketManager from main app
    """
    global decision_runner
    decision_runner = DecisionAnalysisRunner(websocket_manager)


def get_runner() -> DecisionAnalysisRunner:
    """
    Get the global decision runner instance
    
    Returns:
        DecisionAnalysisRunner instance
    
    Raises:
        RuntimeError: If runner not initialized
    """
    if decision_runner is None:
        raise RuntimeError("Decision runner not initialized. Call initialize_runner() first.")
    return decision_runner

