"use client";

import React from "react";
import { useWebSocket } from "./hooks/useWebSocket";

const TransactionAnalysis: React.FC = () => {
  const {
    isConnected,
    isAnalyzing,
    agentResults,
    logs,
    connect,
    disconnect,
    startAnalysis,
  } = useWebSocket();

  const targetAgents = [
    "categorization_agent",
    "fraud_agent",
    "budget_agent",
    "cashflow_agent",
    "synthesizer_agent",
  ];

  const handleStartAnalysis = () => {
    const testTransaction = {
      plaid_transaction_id: "test_websocket_" + Date.now(),
      amount: 125.75,
      merchant_name: "Amazon.com",
      description: "Online purchase - Electronics",
      posted_at: new Date().toISOString().split("T")[0],
      category: "Shopping",
      subcategory: "Electronics",
      account_id: "acc_" + Math.random().toString(36).substr(2, 9),
      location_city: "Seattle",
      location_state: "WA",
      payment_channel: "online",
      transaction_type: "debit",
    };

    console.log("Starting analysis with transaction:", testTransaction);
    startAnalysis(testTransaction);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        🚀 Real-Time Transaction Analysis Dashboard
      </h1>

      {/* Controls */}
      <div className="text-center mb-8">
        <button
          onClick={connect}
          disabled={isConnected}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg mr-4 disabled:bg-gray-400"
        >
          Connect
        </button>
        <button
          onClick={handleStartAnalysis}
          disabled={!isConnected || isAnalyzing}
          className="bg-green-500 text-white px-6 py-3 rounded-lg mr-4 disabled:bg-gray-400"
        >
          {isAnalyzing ? "Analyzing..." : "Start Analysis"}
        </button>
        <button
          onClick={disconnect}
          disabled={!isConnected}
          className="bg-red-500 text-white px-6 py-3 rounded-lg disabled:bg-gray-400"
        >
          Disconnect
        </button>
      </div>

      {/* Status */}
      <div
        className={`text-center p-4 rounded-lg mb-8 ${
          isConnected
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {isConnected ? "Connected" : "Disconnected"}
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {targetAgents.map((agentName) => {
          const result = agentResults[agentName];
          const isCompleted = !!result;
          const isProcessing = isAnalyzing && !isCompleted;

          return (
            <div
              key={agentName}
              className={`p-6 rounded-lg border-l-4 ${
                isCompleted
                  ? "border-green-500 bg-green-50"
                  : isProcessing
                  ? "border-yellow-500 bg-yellow-50"
                  : "border-gray-500 bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {agentName
                    .replace("_agent", "")
                    .replace("_", " ")
                    .toUpperCase()}
                </h3>
                <span className="text-2xl">
                  {agentName === "categorization_agent"
                    ? "🏷️"
                    : agentName === "fraud_agent"
                    ? "🛡️"
                    : agentName === "budget_agent"
                    ? "💰"
                    : agentName === "cashflow_agent"
                    ? "📈"
                    : "💡"}
                </span>
              </div>

              {isProcessing && (
                <div className="flex items-center text-yellow-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                  Processing...
                </div>
              )}

              {isCompleted && result && (
                <div>
                  <div
                    className="font-semibold text-lg mb-2"
                    style={{ color: result.ui_data?.color }}
                  >
                    {result.ui_data?.display_title || "Completed"}
                  </div>
                  <div className="text-gray-600 mb-2">{result.message}</div>
                  {result.ui_data && (
                    <div className="text-sm text-gray-500">
                      {result.ui_data.confidence_percentage && (
                        <div>
                          Confidence: {result.ui_data.confidence_percentage}
                        </div>
                      )}
                      {result.ui_data.fraud_score && (
                        <div>Risk Score: {result.ui_data.fraud_score}</div>
                      )}
                      {result.ui_data.runway_days && (
                        <div>Runway: {result.ui_data.runway_days} days</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isProcessing && !isCompleted && (
                <div className="text-gray-500">Waiting...</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Logs */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">📋 Real-Time Logs</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-sm font-mono text-gray-700">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransactionAnalysis;
