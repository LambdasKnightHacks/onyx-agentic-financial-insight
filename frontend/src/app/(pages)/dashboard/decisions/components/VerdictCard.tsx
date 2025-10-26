"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Target,
} from "lucide-react";

interface VerdictCardProps {
  verdict: {
    recommendation: string;
    winner: string;
    confidence_score: number;
    risk_level: "low" | "medium" | "high";
    key_points?: string[]; // ✅ Make optional since backend might not always provide this
    savings_amount?: number;
    savings_period?: string;
  };
}

export default function VerdictCard({ verdict }: VerdictCardProps) {
  // ✅ Defensive checks for missing data
  if (!verdict) {
    return (
      <Card className="border-2 border-primary shadow-lg">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading verdict data...</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-400 bg-green-900/30";
      case "medium":
        return "text-yellow-400 bg-yellow-900/30";
      case "high":
        return "text-red-400 bg-red-900/30";
      default:
        return "text-gray-400 bg-gray-800";
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-500";
    if (score >= 0.6) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <Card className="border-2 border-primary shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Final Verdict
            </CardTitle>
            <p className="text-sm text-gray-500">
              AI-powered recommendation based on your financial profile
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              className={getRiskColor(verdict.risk_level || "medium")}
              variant="outline"
            >
              Risk: {(verdict.risk_level || "medium").toUpperCase()}
            </Badge>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-500">Confidence:</span>
              <span
                className={`font-bold ${getConfidenceColor(
                  verdict.confidence_score || 0.5
                )}`}
              >
                {Math.round((verdict.confidence_score || 0.5) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Main Recommendation */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1 break-words text-gray-100">
              We Recommend: {verdict.winner || "Processing..."}
            </h3>
            <p className="text-gray-400 break-words whitespace-normal">
              {verdict.recommendation || ""}
            </p>
          </div>
        </div>

        {/* Savings Highlight */}
        {verdict.savings_amount && verdict.savings_amount > 0 && (
          <div className="flex items-center gap-3 p-4 bg-green-900/20 rounded-lg border border-green-700">
            <div className="p-2 bg-green-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-green-400 font-medium">
                Estimated Savings: ${verdict.savings_amount.toLocaleString()}
              </p>
              <p className="text-xs text-green-500">
                Over {verdict.savings_period || "the analysis period"}
              </p>
            </div>
          </div>
        )}

        {/* Key Points */}
        {verdict.key_points && verdict.key_points.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Key Insights
            </h4>
            <ul className="space-y-2">
              {verdict.key_points.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary shrink-0 mt-0.5">•</span>
                  <span className="break-words whitespace-normal flex-1">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Warning if High */}
        {verdict.risk_level === "high" && (
          <div className="flex items-start gap-3 p-4 bg-red-900/20 rounded-lg border border-red-700">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">
                High Risk Alert
              </p>
              <p className="text-xs text-red-500 mt-1">
                This decision may put strain on your financial situation.
                Consider the recommendations carefully before proceeding.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
