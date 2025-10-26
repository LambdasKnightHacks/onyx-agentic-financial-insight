import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Activity, CheckCircle2, Database, Shield, Zap } from "lucide-react";

interface AgentConfig {
  name: string;
  icon: string;
  display: string;
}

interface LiveAnalysisPanelProps {
  isAnalyzing: boolean;
  showAnalysis: boolean;
  agentResults: Record<string, any>;
  lastAnalysisResults: Record<string, any>;
  targetAgents: AgentConfig[];
  onClose: () => void;
}

const transactionMetadata = [
  { icon: Database, label: "Transaction ID", value: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}` },
  { icon: Activity, label: "Processing Mode", value: "Real-time AI Analysis" },
  { icon: Shield, label: "Security Level", value: "Enhanced Protection" },
  { icon: Zap, label: "Processing Time", value: "< 2 seconds" },
];

export function LiveAnalysisPanel({
  isAnalyzing,
  showAnalysis,
  agentResults,
  lastAnalysisResults,
  targetAgents,
  onClose,
}: LiveAnalysisPanelProps) {
  const [isDelaying, setIsDelaying] = useState(false);
  const [prevShowAnalysis, setPrevShowAnalysis] = useState(false);
  const [logEntries, setLogEntries] = useState([
    { action: "Validating transaction data", status: "success", timestamp: new Date(Date.now() - 3000) },
    { action: "Checking account balance", status: "success", timestamp: new Date(Date.now() - 2500) },
    { action: "Verifying merchant credentials", status: "processing", timestamp: new Date(Date.now() - 1500) },
  ]);

  // Simulate log scrolling
  useEffect(() => {
    if (isAnalyzing || isDelaying) {
      const interval = setInterval(() => {
        setLogEntries(prev => {
          const newActions = [
            "Analyzing transaction patterns",
            "Processing fraud detection rules",
            "Evaluating risk factors",
            "Cross-referencing historical data",
            "Generating insights",
          ];
          const randomAction = newActions[Math.floor(Math.random() * newActions.length)];
          const newEntry = {
            action: randomAction,
            status: "processing" as const,
            timestamp: new Date(),
          };
          return [...prev, newEntry].slice(-5);
        });
      }, 1800);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing, isDelaying]);

  // Add a minimum delay to show the loading animation every time panel appears
  useEffect(() => {
    if (showAnalysis && !prevShowAnalysis) {
      setIsDelaying(true);
      const timer = setTimeout(() => {
        setIsDelaying(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
    setPrevShowAnalysis(showAnalysis);
  }, [showAnalysis, prevShowAnalysis]);

  if (!showAnalysis) return null;

  const hasResults = Object.keys(agentResults).length > 0 || Object.keys(lastAnalysisResults).length > 0;
  const isPreparing = (showAnalysis && !isAnalyzing && !hasResults) || isDelaying;
  const isComplete = !isAnalyzing && hasResults && !isDelaying;
  
  // Always show processing state UI (same screen for processing and complete)
  const showProcessingState = isAnalyzing || isPreparing || isComplete;
  const isStillProcessing = isAnalyzing || isPreparing;

  return (
    <Card className={`overflow-hidden transition-all duration-500 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-background`}>
      {/* Progress Bar */}
      <div className="h-1 bg-primary transition-colors duration-500">
        {isStillProcessing && <div className="h-full bg-primary/50 animate-pulse" />}
      </div>

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
              isStillProcessing 
                ? "bg-primary/10 animate-pulse" 
                : "bg-primary/10"
            }`}>
              {isStillProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                Analyzing Transaction in Real-time
              </CardTitle>
              <CardDescription className="text-xs">
                AI agents are actively analyzing transaction data
              </CardDescription>
            </div>
          </div>
          {isComplete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Transaction Metadata */}
        {showProcessingState && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-4 border-b border-border/50">
            {transactionMetadata.map((meta, idx) => {
              const Icon = meta.icon;
              return (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground font-medium">{meta.label}</div>
                    <div className="font-semibold text-foreground">{meta.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Activity Log */}
        {showProcessingState && (
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Activity className="h-4 w-4 text-primary" />
              )}
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                {isComplete ? "Processing Complete" : "Processing Log"}
              </h4>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {logEntries.slice(-4).map((entry, idx) => {
                // Show checkmark if entry is marked as success OR if analysis is complete
                const showCheckmark = entry.status === "success" || isComplete;
                return (
                  <div key={idx} className="flex items-start gap-2 text-xs animate-fade-in">
                    {showCheckmark ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5" />
                    ) : (
                      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin mt-0.5" />
                    )}
                    <span className={`font-medium ${
                      showCheckmark ? "text-green-600 dark:text-green-400" : "text-foreground"
                    }`}>
                      {entry.action}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Agent Status Grid */}
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {targetAgents.map((agent) => {
              const result = isAnalyzing ? agentResults[agent.name] : lastAnalysisResults[agent.name];
              const isCompleted = !!result;
              const isProcessing = isAnalyzing && !isCompleted;
              const isPending = !isAnalyzing && !isCompleted && !hasResults;

              return (
                <div
                  key={agent.name}
                  className={`group relative p-4 rounded-xl border transition-all duration-300 ${
                    isCompleted
                      ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20 hover:border-green-500/50 hover:shadow-sm"
                      : isProcessing || isPending
                      ? "border-primary/30 bg-primary/5 animate-pulse"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <div className="text-center space-y-2">
                    <div className="text-3xl">{agent.icon}</div>
                    <div className="text-xs font-medium text-foreground/90">
                      {agent.display}
                    </div>
                    {(isProcessing || isPending) && (
                      <div className="flex items-center justify-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span className="text-[10px] text-primary font-medium">
                          {isPending ? "Initializing..." : "Analyzing..."}
                        </span>
                      </div>
                    )}
                    {isCompleted && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-xs text-green-600 font-semibold">Complete</span>
                        </div>
                        {result.ui_data && (
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {result.ui_data.display_title && (
                              <div className="font-medium text-foreground/80 truncate">
                                {result.ui_data.display_title}
                              </div>
                            )}
                            {result.ui_data.confidence_percentage && (
                              <div className="text-[10px] text-muted-foreground">
                                {result.ui_data.confidence_percentage}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {!isProcessing && !isCompleted && !isPending && (
                      <div className="text-[10px] text-muted-foreground">Waiting...</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
