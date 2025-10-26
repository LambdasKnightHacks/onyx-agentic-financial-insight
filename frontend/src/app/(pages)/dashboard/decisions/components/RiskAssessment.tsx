"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Activity,
} from "lucide-react";

interface RiskAssessmentProps {
  assessment: {
    overall_risk?: "low" | "medium" | "high";
    dti_ratio?: number;
    dti_status?: "healthy" | "elevated" | "high";
    emergency_fund_months?: number;
    emergency_fund_status?: "strong" | "adequate" | "weak";
    runway_days?: number;
    runway_status?: "safe" | "moderate" | "critical";
    liquidity_score?: number;
    stress_tests?: {
      income_drop_10?: {
        passes?: boolean;
        message?: string;
        impact?: {
          new_monthly_income?: number;
          new_monthly_expenses?: number;
          new_monthly_margin?: number;
          emergency_fund_depletion_months?: number;
        };
      };
      income_drop_20?: {
        passes?: boolean;
        message?: string;
        impact?: {
          new_monthly_income?: number;
          new_monthly_expenses?: number;
          new_monthly_margin?: number;
          emergency_fund_depletion_months?: number;
        };
      };
      expense_spike?: {
        passes?: boolean;
        message?: string;
        impact?: {
          new_monthly_expenses?: number;
          new_monthly_margin?: number;
        };
      };
      emergency_expense?: {
        passes?: boolean;
        message?: string;
        impact?: {
          remaining_emergency_fund?: number;
          months_covered?: number;
        };
      };
    };
  };
}

export default function RiskAssessment({ assessment }: RiskAssessmentProps) {
  // ✅ Defensive check for missing assessment
  if (!assessment) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading risk assessment...</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return {
          bg: "bg-green-900/20",
          border: "border-green-700",
          text: "text-green-400",
          badge: "bg-green-900/30 text-green-400",
        };
      case "medium":
        return {
          bg: "bg-yellow-900/20",
          border: "border-yellow-700",
          text: "text-yellow-400",
          badge: "bg-yellow-900/30 text-yellow-400",
        };
      case "high":
        return {
          bg: "bg-red-900/20",
          border: "border-red-700",
          text: "text-red-400",
          badge: "bg-red-900/30 text-red-400",
        };
      default:
        return {
          bg: "bg-gray-800",
          border: "border-gray-700",
          text: "text-gray-400",
          badge: "bg-gray-800 text-gray-400",
        };
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "healthy" || status === "strong" || status === "safe") {
      return "text-green-500";
    } else if (
      status === "adequate" ||
      status === "moderate" ||
      status === "elevated"
    ) {
      return "text-yellow-500";
    } else {
      return "text-red-500";
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "healthy" || status === "strong" || status === "safe") {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    } else if (
      status === "adequate" ||
      status === "moderate" ||
      status === "elevated"
    ) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const riskColors = getRiskColor(assessment.overall_risk || "medium");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Risk Assessment
          </CardTitle>
          <Badge className={riskColors.badge} variant="outline">
            {(assessment.overall_risk || "medium").toUpperCase()} RISK
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* DTI Ratio */}
          {assessment.dti_ratio !== undefined && (
            <div
              className={`p-4 rounded-lg border ${riskColors.border} ${riskColors.bg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-100">
                  Debt-to-Income
                </span>
                {getStatusIcon(assessment.dti_status || "moderate")}
              </div>
              <div className="text-2xl font-bold text-gray-100">
                {Math.round((assessment.dti_ratio || 0) * 100)}%
              </div>
              <div className="mt-2">
                <Progress
                  value={(assessment.dti_ratio || 0) * 100}
                  className="h-2"
                />
              </div>
              {assessment.dti_status && (
                <p
                  className={`text-xs mt-1 ${getStatusColor(
                    assessment.dti_status
                  )}`}
                >
                  {assessment.dti_status.toUpperCase()}
                </p>
              )}
            </div>
          )}

          {/* Emergency Fund */}
          {assessment.emergency_fund_months !== undefined && (
            <div
              className={`p-4 rounded-lg border ${riskColors.border} ${riskColors.bg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-100">
                  Emergency Fund
                </span>
                {getStatusIcon(assessment.emergency_fund_status || "moderate")}
              </div>
              <div className="text-2xl font-bold text-gray-100">
                {(assessment.emergency_fund_months || 0).toFixed(1)} mo
              </div>
              <div className="mt-2">
                <Progress
                  value={((assessment.emergency_fund_months || 0) / 6) * 100}
                  className="h-2"
                />
              </div>
              {assessment.emergency_fund_status && (
                <p
                  className={`text-xs mt-1 ${getStatusColor(
                    assessment.emergency_fund_status
                  )}`}
                >
                  {assessment.emergency_fund_status.toUpperCase()}
                </p>
              )}
            </div>
          )}

          {/* Runway */}
          {assessment.runway_days !== undefined && (
            <div
              className={`p-4 rounded-lg border ${riskColors.border} ${riskColors.bg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-100">
                  Cash Runway
                </span>
                {getStatusIcon(assessment.runway_status || "moderate")}
              </div>
              <div className="text-2xl font-bold text-gray-100">
                {assessment.runway_days || 0} days
              </div>
              <div className="mt-2">
                <Progress
                  value={((assessment.runway_days || 0) / 180) * 100}
                  className="h-2"
                />
              </div>
              {assessment.runway_status && (
                <p
                  className={`text-xs mt-1 ${getStatusColor(
                    assessment.runway_status
                  )}`}
                >
                  {assessment.runway_status.toUpperCase()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Liquidity Score */}
        {assessment.liquidity_score !== undefined && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold flex items-center gap-2 text-gray-100">
                <Activity className="h-4 w-4" />
                Liquidity Score
              </span>
              <span className="text-lg font-bold text-gray-100">
                {((assessment.liquidity_score || 0) * 100).toFixed(0)}/100
              </span>
            </div>
            <Progress
              value={(assessment.liquidity_score || 0) * 100}
              className="h-3"
            />
            <p className="text-xs text-gray-500 mt-1">
              Higher scores indicate better ability to handle unexpected
              expenses
            </p>
          </div>
        )}

        {/* Stress Tests */}
        {assessment.stress_tests &&
          Object.keys(assessment.stress_tests).length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-primary" />
                Stress Test Scenarios
              </h4>
              <div className="space-y-2">
                {Object.entries(assessment.stress_tests).map(([key, test]) => {
                  if (!test) return null;

                  const testName = key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase());

                  const passes = test.passes || false;
                  const message = test.message || "";
                  const impact = test.impact || {};

                  // Format context based on test type
                  let contextDetails: JSX.Element | null = null;

                  if (key === "income_drop_10" || key === "income_drop_20") {
                    contextDetails = (
                      <div className="mt-2 space-y-1 text-xs">
                        {impact.new_monthly_income !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">New Income:</span>
                            <span className="text-gray-100">
                              ${impact.new_monthly_income.toLocaleString()}/mo
                            </span>
                          </div>
                        )}
                        {impact.new_monthly_expenses !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">New Expenses:</span>
                            <span className="text-gray-100">
                              ${impact.new_monthly_expenses.toLocaleString()}/mo
                            </span>
                          </div>
                        )}
                        {impact.new_monthly_margin !== undefined && (
                          <div
                            className={`flex justify-between font-medium ${
                              passes ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            <span>Monthly Margin:</span>
                            <span>
                              ${impact.new_monthly_margin.toLocaleString()}/mo
                            </span>
                          </div>
                        )}
                        {impact.emergency_fund_depletion_months && (
                          <div className="text-yellow-400 mt-1">
                            ⚠️ Fund depleted in{" "}
                            {impact.emergency_fund_depletion_months.toFixed(1)}{" "}
                            months
                          </div>
                        )}
                      </div>
                    );
                  } else if (key === "expense_spike") {
                    contextDetails = (
                      <div className="mt-2 space-y-1 text-xs">
                        {impact.new_monthly_expenses !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Spiked Expenses:
                            </span>
                            <span className="text-gray-100">
                              ${impact.new_monthly_expenses.toLocaleString()}/mo
                            </span>
                          </div>
                        )}
                        {impact.new_monthly_margin !== undefined && (
                          <div
                            className={`flex justify-between font-medium ${
                              passes ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            <span>Monthly Margin:</span>
                            <span>
                              ${impact.new_monthly_margin.toLocaleString()}/mo
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  } else if (key === "emergency_expense") {
                    contextDetails = (
                      <div className="mt-2 space-y-1 text-xs">
                        {impact.remaining_emergency_fund !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Remaining Fund:
                            </span>
                            <span className="text-gray-100">
                              $
                              {impact.remaining_emergency_fund.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {impact.months_covered !== undefined && (
                          <div
                            className={`flex justify-between font-medium ${
                              passes ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            <span>Months Covered:</span>
                            <span>
                              {impact.months_covered.toFixed(1)} months
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border ${
                        passes
                          ? "bg-green-900/20 border-green-700"
                          : "bg-red-900/20 border-red-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {passes ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium break-words text-gray-100">
                              {testName}
                            </p>
                            <Badge
                              variant={passes ? "default" : "destructive"}
                              className="text-xs shrink-0"
                            >
                              {passes ? "PASS" : "FAIL"}
                            </Badge>
                          </div>
                          {message && (
                            <p className="text-xs text-gray-500 mb-2 break-words whitespace-normal">
                              {message}
                            </p>
                          )}
                          {contextDetails}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Overall Risk Summary */}
        <div
          className={`p-4 rounded-lg border-2 ${riskColors.border} ${riskColors.bg}`}
        >
          <p className="text-sm whitespace-normal break-words text-gray-100">
            <span className="font-semibold">Overall Assessment: </span>
            {assessment.overall_risk === "low" && (
              <span className="inline-block">
                Your financial position is strong enough to handle this decision
                comfortably. All key metrics are within healthy ranges.
              </span>
            )}
            {assessment.overall_risk === "medium" && (
              <span className="inline-block">
                This decision is manageable but will require some budget
                adjustments. Monitor your cash flow carefully over the next few
                months.
              </span>
            )}
            {assessment.overall_risk === "high" && (
              <span className="inline-block">
                This decision poses significant risk to your financial
                stability. Consider delaying or exploring alternative options.
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
