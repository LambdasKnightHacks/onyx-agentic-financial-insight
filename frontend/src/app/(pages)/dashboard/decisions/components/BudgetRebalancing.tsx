"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Wallet, TrendingDown, CheckCircle2, DollarSign } from "lucide-react";

interface BudgetRecommendation {
  category: string;
  current_monthly: number;
  recommended_monthly: number;
  change_amount: number;
  change_percentage: number;
  specific_actions: string[];
  difficulty: "easy" | "medium" | "hard";
}

interface BudgetRebalancingProps {
  recommendations: BudgetRecommendation[];
  onApply?: (selectedRecommendations: string[]) => void;
}

export default function BudgetRebalancing({
  recommendations,
  onApply,
}: BudgetRebalancingProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(recommendations.map((r) => r.category))
  );

  const toggleCategory = (category: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedCategories(newSelected);
  };

  const totalSavings = recommendations
    .filter((r) => selectedCategories.has(r.category))
    .reduce((sum, r) => sum + Math.abs(r.change_amount), 0);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-900/30 text-green-400";
      case "medium":
        return "bg-yellow-900/30 text-yellow-400";
      case "hard":
        return "bg-red-900/30 text-red-400";
      default:
        return "bg-gray-800 text-gray-400";
    }
  };

  const handleApply = () => {
    if (onApply) {
      onApply(Array.from(selectedCategories));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Budget Rebalancing Recommendations
          </CardTitle>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Potential Monthly Savings
            </div>
            <div className="text-2xl font-bold text-green-500">
              ${totalSavings.toFixed(0)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Info Banner */}
        <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p className="text-sm text-blue-400">
            <strong>Personalized for you:</strong> These recommendations are
            based on your actual spending patterns and elasticity scores. Toggle
            the switches below to customize which changes you want to implement.
          </p>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const isSelected = selectedCategories.has(rec.category);
            const savingsAmount = Math.abs(rec.change_amount);
            const savingsPercent = Math.abs(rec.change_percentage);

            return (
              <div
                key={rec.category}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-muted bg-muted/30 opacity-60"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Toggle */}
                  <Switch
                    checked={isSelected}
                    onCheckedChange={() => toggleCategory(rec.category)}
                    className="mt-1"
                  />

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold capitalize text-gray-100">
                          {rec.category}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            className={getDifficultyColor(rec.difficulty)}
                            variant="outline"
                          >
                            {rec.difficulty} to achieve
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Currently: ${rec.current_monthly.toFixed(0)}/mo
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-green-500">
                          <TrendingDown className="h-4 w-4" />
                          <span className="font-bold">
                            ${savingsAmount.toFixed(0)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          ({savingsPercent.toFixed(0)}% reduction)
                        </div>
                      </div>
                    </div>

                    {/* Target */}
                    <div className="p-2 bg-gray-800 rounded border border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">New Target:</span>
                        <span className="font-semibold text-gray-100">
                          ${rec.recommended_monthly.toFixed(0)}/month
                        </span>
                      </div>
                    </div>

                    {/* Specific Actions */}
                    {rec.specific_actions &&
                      rec.specific_actions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            How to achieve:
                          </p>
                          <ul className="space-y-1">
                            {rec.specific_actions.map((action, idx) => (
                              <li
                                key={idx}
                                className="text-xs flex items-start gap-2 text-gray-500"
                              >
                                <span className="text-primary shrink-0 mt-0.5">
                                  •
                                </span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary & Action */}
        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-900/20 to-green-900/10 rounded-lg border border-green-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-green-400">
                  Total Monthly Savings: ${totalSavings.toFixed(0)}
                </p>
                <p className="text-xs text-green-500">
                  {selectedCategories.size} of {recommendations.length}{" "}
                  recommendations selected
                </p>
              </div>
            </div>
            {onApply && (
              <Button
                onClick={handleApply}
                disabled={selectedCategories.size === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Apply Selected
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center">
            Note: These are recommendations only. You can manually adjust your
            budgets or let our AI help you implement these changes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
