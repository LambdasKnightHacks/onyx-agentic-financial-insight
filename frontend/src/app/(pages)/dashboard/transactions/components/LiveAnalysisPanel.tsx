import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Loader2 } from "lucide-react";

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

  // Add a minimum delay to show the loading animation every time panel appears
  useEffect(() => {
    // Detect when showAnalysis changes from false to true (new analysis starting)
    if (showAnalysis && !prevShowAnalysis) {
      setIsDelaying(true);
      const timer = setTimeout(() => {
        setIsDelaying(false);
      }, 600); // 600ms delay to see the loading animation
      
      return () => clearTimeout(timer);
    }
    
    // Update previous state
    setPrevShowAnalysis(showAnalysis);
  }, [showAnalysis, prevShowAnalysis]);

  if (!showAnalysis) return null;

  const hasResults = Object.keys(agentResults).length > 0 || Object.keys(lastAnalysisResults).length > 0;
  const isPreparing = (showAnalysis && !isAnalyzing && !hasResults) || isDelaying;
  const isComplete = !isAnalyzing && hasResults && !isDelaying;

  return (
    <Card
      className={`overflow-hidden transition-all duration-500 ${
        isAnalyzing || isPreparing
          ? "border-primary/30 bg-linear-to-br from-primary/5 via-primary/3 to-background"
          : "border-green-500/30 bg-linear-to-br from-green-50/50 via-background to-background"
      }`}
    >
      <div
        className={`h-1 ${
          isAnalyzing || isPreparing ? "bg-primary" : "bg-green-500"
        } transition-colors duration-500`}
      >
        {(isAnalyzing || isPreparing) && <div className="h-full bg-primary/50 animate-pulse" />}
      </div>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                isAnalyzing || isPreparing ? "bg-primary/10" : "bg-green-500/10"
              }`}
            >
              {isAnalyzing || isPreparing ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-500"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div>
              <CardTitle className="text-lg">
                {isPreparing 
                  ? "Preparing Analysis..." 
                  : isAnalyzing 
                  ? "AI Analysis in Progress" 
                  : "Analysis Complete"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isPreparing
                  ? "Connecting to AI agents..."
                  : isAnalyzing
                  ? "Multiple agents processing your transaction"
                  : "All agents finished • Results ready"}
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {targetAgents.map((agent) => {
            const result = isAnalyzing
              ? agentResults[agent.name]
              : lastAnalysisResults[agent.name];
            const isCompleted = !!result;
            const isProcessing = isAnalyzing && !isCompleted;
            const isPreparing = !isAnalyzing && !isCompleted && !hasResults;

            return (
              <div
                key={agent.name}
                className={`group relative p-4 rounded-xl border transition-all duration-300 ${
                  isCompleted
                    ? "border-green-500/30 bg-green-50/50 hover:border-green-500/50 hover:shadow-sm"
                    : isProcessing || isPreparing
                    ? "border-primary/30 bg-primary/5 animate-pulse"
                    : "border-border bg-muted/30"
                }`}
              >
                <div className="text-center space-y-2">
                  <div className="text-3xl">{agent.icon}</div>
                  <div className="text-xs font-medium text-foreground/90">
                    {agent.display}
                  </div>
                  {(isProcessing || isPreparing) && (
                    <div className="flex items-center justify-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="text-[10px] text-primary font-medium">
                        {isPreparing ? "Loading..." : "Processing"}
                      </span>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-green-600"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-xs text-green-600 font-semibold">
                          Done
                        </span>
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
                  {!isProcessing && !isCompleted && !isPreparing && (
                    <div className="text-[10px] text-muted-foreground">
                      Waiting...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

