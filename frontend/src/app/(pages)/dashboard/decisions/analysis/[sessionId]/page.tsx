"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";
import { useDecisionWebSocket } from "../../hooks/useDecisionWebSocket";
import VerdictCard from "../../components/VerdictCard";
import TCOComparisonChart from "../../components/TCOComparisonChart";
import RiskAssessment from "../../components/RiskAssessment";
import BudgetRebalancing from "../../components/BudgetRebalancing";
import ActionChecklist from "../../components/ActionChecklist";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default function LiveAnalysisPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { sessionId } = resolvedParams;
  const router = useRouter();
  const [showResults, setShowResults] = useState(false);

  const {
    isConnected,
    currentStep,
    totalSteps,
    agentProgress,
    agentDisplayNames,
    isComplete,
    error,
    finalResult,
  } = useDecisionWebSocket(sessionId);

  const agentNames = [
    "data_fusion_agent",
    "tco_calculator_agent",
    "risk_liquidity_agent",
    "credit_impact_agent",
    "opportunity_cost_agent",
    "behavioral_coach_agent",
    "synthesis_agent",
  ];

  const progressPercentage = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (isComplete && finalResult) {
      // Show results after a brief delay
      setTimeout(() => {
        setShowResults(true);
      }, 1000);
    }
  }, [isComplete, finalResult]);

  if (showResults && finalResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-yellow-500" />
              Analysis Complete!
            </h1>
            <p className="text-muted-foreground mt-2">
              Your financial decision analysis is ready
            </p>
          </div>
          <Button onClick={() => router.push("/dashboard/decisions")}>
            New Analysis
          </Button>
        </div>

        <Alert className="border-green-700 bg-green-900/20">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-400">
            All 7 AI agents have completed their analysis. Review your
            comprehensive results below.
          </AlertDescription>
        </Alert>

        {/* Results Components */}
        <div className="space-y-6">
          {/* Verdict Card */}
          {finalResult?.verdict && (
            <VerdictCard verdict={finalResult.verdict} />
          )}

          {/* TCO Comparison */}
          {finalResult?.options && finalResult.options.length > 0 && (
            <TCOComparisonChart options={finalResult.options} />
          )}

          {/* Risk Assessment */}
          {finalResult?.risk_assessment && (
            <RiskAssessment assessment={finalResult.risk_assessment} />
          )}

          {/* Budget Rebalancing */}
          {finalResult?.budget_recommendations &&
            finalResult.budget_recommendations.length > 0 && (
              <BudgetRebalancing
                recommendations={finalResult.budget_recommendations}
                onApply={(selected) => {
                  console.log("Applying budget recommendations:", selected);
                  // TODO: Implement API call to apply budget changes
                }}
              />
            )}

          {/* Action Checklist */}
          {finalResult?.action_checklist &&
            finalResult.action_checklist.length > 0 && (
              <ActionChecklist actions={finalResult.action_checklist} />
            )}

          {/* Debug View (only show if no structured data available) */}
          {!finalResult?.verdict && !finalResult?.options && (
            <Card>
              <CardHeader>
                <CardTitle>Raw Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-xs overflow-auto max-h-96">
                    {JSON.stringify(finalResult, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Analyzing Your Decision
        </h1>
        <p className="text-muted-foreground mt-2">
          Our AI agents are processing your financial data in real-time
        </p>
      </div>

      {/* Connection Status */}
      {!isConnected && !error && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Connecting to analysis stream...</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Overall Progress</CardTitle>
            <Badge variant={isComplete ? "default" : "secondary"}>
              {currentStep} of {totalSteps} Agents
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex justify-between text-sm text-gray-500">
            <span>Starting analysis...</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
        </CardContent>
      </Card>

      {/* Agent Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agentNames.map((agentName, index) => {
              const agent = agentProgress[agentName] || { status: "pending" };
              const displayName = agentDisplayNames[agentName] || agentName;

              return (
                <div
                  key={agentName}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    agent.status === "in_progress"
                      ? "bg-blue-900/20 border-blue-700"
                      : agent.status === "completed"
                      ? "bg-green-900/20 border-green-700"
                      : agent.status === "error"
                      ? "bg-red-900/20 border-red-700"
                      : "bg-muted/50"
                  }`}
                >
                  {/* Icon */}
                  <div className="shrink-0">
                    {agent.status === "completed" ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : agent.status === "in_progress" ? (
                      <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                    ) : agent.status === "error" ? (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-100">
                        {displayName}
                      </span>
                      {agent.processing_time_ms && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {Math.round(agent.processing_time_ms)}ms
                        </Badge>
                      )}
                    </div>
                    {agent.message && (
                      <p className="text-sm text-gray-500 mt-1">
                        {agent.message}
                      </p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant={
                      agent.status === "completed"
                        ? "default"
                        : agent.status === "in_progress"
                        ? "secondary"
                        : agent.status === "error"
                        ? "destructive"
                        : "outline"
                    }
                    className="capitalize"
                  >
                    {agent.status === "in_progress"
                      ? "Processing"
                      : agent.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      {isConnected && !isComplete && (
        <Card className="border-blue-700 bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="p-2 bg-blue-900/30 rounded-lg h-fit">
                <Sparkles className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-blue-400">
                  AI Processing in Progress
                </p>
                <p className="text-sm text-blue-500 mt-1">
                  Our 7-agent system is analyzing your financial data,
                  calculating TCO, assessing risk, and generating personalized
                  recommendations. This typically takes 30-60 seconds.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
