"use client";
import { useEffect, useRef, useState } from "react";
import { WEBSOCKET_CONFIG } from "@/lib/websocket-config";

interface WebSocketMessage {
  type:
    | "analysis_started"
    | "agent_started"
    | "agent_completed"
    | "analysis_complete"
    | "error";
  timestamp: string;
  data: any;
}

interface AgentResult {
  agent_name: string;
  status: string;
  result?: any;
  message: string;
  ui_data?: {
    display_title: string;
    icon: string;
    color: string;
    [key: string]: any;
  };
}

export const useWebSocket = (userId?: string) => {
  const effectiveUserId = userId || WEBSOCKET_CONFIG.testUserId;
  const [isConnected, setIsConnected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [agentResults, setAgentResults] = useState<Record<string, AgentResult>>(
    {}
  );
  const [logs, setLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("Already connected");
      return;
    }

    // Close any existing connection first
    if (wsRef.current) {
      wsRef.current.close();
    }

    console.log(`Attempting to connect to ${WEBSOCKET_CONFIG.url}`);
    addLog(`Connecting to WebSocket...`);

    try {
      wsRef.current = new WebSocket(WEBSOCKET_CONFIG.url);

      wsRef.current.onopen = () => {
        console.log("WebSocket connection opened");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
        addLog("✅ WebSocket connected");
      };

      wsRef.current.onmessage = (event) => {
        console.log("Received message:", event.data);
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log("Parsed message:", data);
          handleMessage(data);
        } catch (error) {
          console.error("Failed to parse message:", error);
          addLog(`❌ Failed to parse message: ${error}`);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket connection closed", event);
        setIsConnected(false);
        setIsAnalyzing(false);
        addLog("WebSocket disconnected");

        // Attempt reconnection if not a clean close and within retry limits
        if (
          !event.wasClean &&
          reconnectAttemptsRef.current < WEBSOCKET_CONFIG.maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current += 1;
          addLog(
            `Attempting to reconnect (${reconnectAttemptsRef.current}/${WEBSOCKET_CONFIG.maxReconnectAttempts})...`
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, WEBSOCKET_CONFIG.reconnectDelay);
        } else if (
          reconnectAttemptsRef.current >= WEBSOCKET_CONFIG.maxReconnectAttempts
        ) {
          addLog("❌ Max reconnection attempts reached. Please try manually.");
        }
      };

      wsRef.current.onerror = (error) => {
        // Only log error if we were previously connected
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          console.error("WebSocket error:", error);
          addLog(`❌ WebSocket error occurred`);
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      addLog(`❌ Failed to connect: ${error}`);
    }
  };

  const disconnect = () => {
    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = WEBSOCKET_CONFIG.maxReconnectAttempts; // Prevent auto-reconnect
    wsRef.current?.close();
    addLog("Manually disconnected");
  };

  const startAnalysis = (transaction: any) => {
    console.log("startAnalysis called", { isConnected, isAnalyzing });
    if (!isConnected) {
      console.error("Cannot start analysis - not connected");
      addLog("Error: Not connected. Please connect first.");
      return;
    }
    if (isAnalyzing) {
      console.log("Already analyzing");
      return;
    }

    const message = {
      user_id: effectiveUserId,
      transaction,
    };

    console.log("Sending transaction message:", message);
    wsRef.current?.send(JSON.stringify(message));
    addLog("Sent transaction for analysis");
  };

  const handleMessage = (data: WebSocketMessage) => {
    addLog(`${data.type}: ${data.data.message || JSON.stringify(data.data)}`);

    switch (data.type) {
      case "analysis_started":
        setIsAnalyzing(true);
        setAgentResults({});
        break;
      case "agent_started":
        // Agent started processing
        break;
      case "agent_completed":
        setAgentResults((prev) => ({
          ...prev,
          [data.data.agent_name]: data.data,
        }));
        break;
      case "analysis_complete":
        setIsAnalyzing(false);
        addLog(
          `Analysis completed in ${data.data.total_processing_time.toFixed(2)}s`
        );
        break;
      case "error":
        setIsAnalyzing(false);
        break;
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`${timestamp}: ${message}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, []);

  return {
    isConnected,
    isAnalyzing,
    agentResults,
    logs,
    connect,
    disconnect,
    startAnalysis,
  };
};
