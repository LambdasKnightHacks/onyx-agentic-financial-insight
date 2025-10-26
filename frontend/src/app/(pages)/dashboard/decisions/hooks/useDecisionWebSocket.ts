"use client";

import { useEffect, useState, useRef } from "react";
import type { DecisionWebSocketEvent } from "@/types/decision-types";

interface AgentProgress {
  name: string;
  status: "pending" | "in_progress" | "completed" | "error";
  message?: string;
  processing_time_ms?: number;
}

export function useDecisionWebSocket(sessionId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps] = useState(7); // 7 agents in the pipeline
  const [agentProgress, setAgentProgress] = useState<
    Record<string, AgentProgress>
  >({});
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<any>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const agentNames = [
    "data_fusion_agent",
    "tco_calculator_agent",
    "risk_liquidity_agent",
    "credit_impact_agent",
    "opportunity_cost_agent",
    "behavioral_coach_agent",
    "synthesis_agent",
  ];

  const agentDisplayNames: Record<string, string> = {
    data_fusion_agent: "Data Fusion",
    tco_calculator_agent: "TCO Calculator",
    risk_liquidity_agent: "Risk & Liquidity",
    credit_impact_agent: "Credit Impact",
    opportunity_cost_agent: "Opportunity Cost",
    behavioral_coach_agent: "Behavioral Coach",
    synthesis_agent: "Synthesis",
  };

  useEffect(() => {
    if (!sessionId) return;

    const connectWebSocket = () => {
      const ws = new WebSocket(`ws://localhost:8000/ws/decisions/${sessionId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WebSocket] Connected to decision analysis stream");
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data: DecisionWebSocketEvent = JSON.parse(event.data);
          console.log("[WebSocket] Received event:", data);

          switch (data.type) {
            case "analysis_started":
              console.log("[WebSocket] Analysis started");
              // Initialize all agents as pending
              const initialProgress: Record<string, AgentProgress> = {};
              agentNames.forEach((name) => {
                initialProgress[name] = { name, status: "pending" };
              });
              setAgentProgress(initialProgress);
              break;

            case "agent_started":
              const startedAgent = data.data.agent_name;
              setAgentProgress((prev) => ({
                ...prev,
                [startedAgent]: {
                  ...prev[startedAgent],
                  status: "in_progress",
                },
              }));
              setCurrentStep(
                data.data.step_number || agentNames.indexOf(startedAgent) + 1
              );
              break;

            case "agent_progress":
              const progressAgent = data.data.agent_name;
              setAgentProgress((prev) => ({
                ...prev,
                [progressAgent]: {
                  ...prev[progressAgent],
                  message: data.data.progress_message,
                },
              }));
              break;

            case "agent_completed":
              const completedAgent = data.data.agent_name;
              setAgentProgress((prev) => ({
                ...prev,
                [completedAgent]: {
                  ...prev[completedAgent],
                  status: "completed",
                  processing_time_ms: data.data.processing_time_ms,
                },
              }));
              break;

            case "analysis_complete":
              console.log("[WebSocket] Analysis complete!");
              setIsComplete(true);
              setFinalResult(data.data.final_result);
              if (wsRef.current) {
                wsRef.current.close();
              }
              break;

            case "error":
              console.error("[WebSocket] Error:", data.data);
              setError(data.data.error_message || "An error occurred");
              setAgentProgress((prev) => {
                const updated = { ...prev };
                if (data.data.agent_name && updated[data.data.agent_name]) {
                  updated[data.data.agent_name].status = "error";
                }
                return updated;
              });
              break;
          }
        } catch (err) {
          console.error("[WebSocket] Failed to parse message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        setError("WebSocket connection error");
      };

      ws.onclose = () => {
        console.log("[WebSocket] Connection closed");
        setIsConnected(false);

        // Try to reconnect if analysis not complete
        if (!isComplete && !error) {
          console.log("[WebSocket] Attempting to reconnect in 3s...");
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        }
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // ✅ FIX: Only reconnect when sessionId changes

  return {
    isConnected,
    currentStep,
    totalSteps,
    agentProgress,
    agentDisplayNames,
    isComplete,
    error,
    finalResult,
  };
}
