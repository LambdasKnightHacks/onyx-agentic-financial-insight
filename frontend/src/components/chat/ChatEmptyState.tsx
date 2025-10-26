"use client";

import {
  Bot,
  TrendingUp,
  PieChart,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatEmptyStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  {
    icon: TrendingUp,
    text: "Show my 60-day cashflow",
    color: "text-blue-500",
  },
  {
    icon: PieChart,
    text: "Where is my money going?",
    color: "text-green-500",
  },
  {
    icon: DollarSign,
    text: "What's my budget status?",
    color: "text-purple-500",
  },
  {
    icon: AlertCircle,
    text: "Show recent alerts",
    color: "text-orange-500",
  },
];

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-primary/10 rounded-full p-6 mb-4">
        <Bot className="h-12 w-12 text-primary" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Ask FinFlow AI Anything</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        I can help you understand your spending, track budgets, detect
        anomalies, and provide personalized financial insights.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
        {suggestions.map((suggestion, idx) => {
          const Icon = suggestion.icon;
          return (
            <Button
              key={idx}
              variant="outline"
              className="h-auto py-4 px-3 justify-start text-left hover:bg-accent/50 transition-colors"
              onClick={() => onSuggestionClick(suggestion.text)}
            >
              <div className="flex items-start gap-3 w-full">
                <Icon
                  className={`h-5 w-5 mt-0.5 shrink-0 ${suggestion.color}`}
                />
                <span className="text-md leading-relaxed text-left">
                  {suggestion.text}
                </span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
