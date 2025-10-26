"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  Lightbulb,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import type { Insight } from "@/src/lib/types";

interface FinancialSummary {
  period: {
    days: number;
    start_date: string;
    end_date: string;
    generated_at: string;
  };
  financial_overview: {
    total_income: number;
    total_expenses: number;
    net_flow: number;
    avg_daily_income: number;
    avg_daily_expenses: number;
  };
  spending_breakdown: {
    top_categories: Array<{
      category: string;
      amount: number;
      count: number;
      percentage: number;
    }>;
    total_categories: number;
  };
  spending_trends: {
    direction: string;
    change_percentage: number;
    interpretation: string;
  };
  risks: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    why: string;
    estimated_impact: string;
  }>;
  next_best_actions: Array<{
    action: string;
    priority: string;
    why: string;
    estimated_impact: string;
    choices: string[];
    how: string;
  }>;
  micro_lesson: {
    title: string;
    content: string;
    why: string;
    takeaway: string;
  };
  wins: Array<{
    achievement: string;
    impact: string;
    celebration: string;
  }>;
  metrics: {
    savings_rate: number;
    expense_ratio: number;
    days_until_breach: number;
  };
  balance: {
    health: string;
    current: number;
    available: number;
    runway_days: number;
  };
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [financialSummary, setFinancialSummary] =
    useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch financial summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const user_id =
          localStorage.getItem("user_id") ||
          "bdd8ced0-6b8d-47e1-9c68-866c080994e8"; // fallback for demo

        const response = await fetch("/api/financial-summary/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id,
            period_days: 30,
          }),
        });

        const data = await response.json();

        if (data.status === "success" && data.summary) {
          setFinancialSummary(data.summary);
        }
      } catch (err) {
        console.error("Error fetching financial summary:", err);
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchSummary();
  }, []);

  // Fetch insights
  useEffect(() => {
    fetch("/api/insights")
      .then((res) => res.json())
      .then((data) => {
        setInsights(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading || summaryLoading) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>Failed to load insights: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate summary metrics
  const highConfidenceInsights = insights.filter((i) => i.confidence > 0.8);
  const totalPotentialSavings = insights
    .filter((i) => i.cta?.params?.amount)
    .reduce((sum, i) => sum + (i.cta?.params?.amount || 0), 0);

  return (
    <div className="px-8 pb-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered recommendations to help you manage your finances better
        </p>
      </div>

      {/* Financial Summary Box */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Your Financial Summary</CardTitle>
              <CardDescription className="mt-1.5 text-base leading-relaxed">
                {financialSummary
                  ? `Based on your activity from ${financialSummary.period.start_date} to ${financialSummary.period.end_date}`
                  : "Analyzing your financial data..."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {financialSummary ? (
            <>
              {/* Financial Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-xl font-bold text-green-600">
                    $
                    {financialSummary.financial_overview.total_income.toFixed(
                      2
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Total Expenses
                  </p>
                  <p className="text-xl font-bold text-red-600">
                    $
                    {financialSummary.financial_overview.total_expenses.toFixed(
                      2
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Net Flow</p>
                  <p
                    className={`text-xl font-bold ${
                      financialSummary.financial_overview.net_flow >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ${financialSummary.financial_overview.net_flow.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Savings Rate</p>
                  <p
                    className={`text-xl font-bold ${
                      financialSummary.metrics.savings_rate > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {financialSummary.metrics.savings_rate.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Spending Trends */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                {financialSummary.spending_trends.direction === "increasing" ? (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                )}
                <span className="text-sm">
                  <strong>
                    {financialSummary.spending_trends.interpretation}
                  </strong>{" "}
                  compared to earlier in the period
                </span>
              </div>

              {/* Balance & Health */}
              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Current Balance
                  </p>
                  <p className="text-lg font-bold">
                    ${financialSummary.balance.current.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cash Runway</p>
                  <p
                    className={`text-lg font-bold ${
                      financialSummary.balance.runway_days >= 30
                        ? "text-green-600"
                        : financialSummary.balance.runway_days >= 7
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {financialSummary.balance.runway_days} days
                  </p>
                </div>
              </div>

              {/* Top Categories */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Top Spending Categories
                </p>
                <div className="space-y-2">
                  {financialSummary.spending_breakdown.top_categories
                    .slice(0, 3)
                    .map((cat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize">
                          {cat.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${Math.min(cat.percentage, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-20 text-right">
                            ${cat.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Accordion for detailed information */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="details">
                  <AccordionTrigger className="text-sm font-medium">
                    View Detailed Breakdown
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {/* Risks */}
                    {financialSummary.risks.length > 0 && (
                      <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-r-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-amber-900 dark:text-amber-400">
                              {financialSummary.risks[0].title}
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                              {financialSummary.risks[0].description}
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                              Why: {financialSummary.risks[0].why}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Next Best Actions */}
                    {financialSummary.next_best_actions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Recommended Actions
                        </p>
                        {financialSummary.next_best_actions
                          .slice(0, 2)
                          .map((action, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg border border-primary/20 bg-primary/5"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                  <p className="font-medium">{action.action}</p>
                                </div>
                                <Badge
                                  variant={
                                    action.priority === "high"
                                      ? "destructive"
                                      : action.priority === "medium"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {action.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {action.why}
                              </p>
                              <p className="text-xs text-primary">
                                Impact: {action.estimated_impact}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1.5">
                                How: {action.how}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Micro Lesson */}
                    {financialSummary.micro_lesson && (
                      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                        <p className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                          💡 {financialSummary.micro_lesson.title}
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                          {financialSummary.micro_lesson.content}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {financialSummary.micro_lesson.takeaway}
                        </p>
                      </div>
                    )}

                    {/* Wins */}
                    {financialSummary.wins.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Achievements</p>
                        {financialSummary.wins.map((win, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900"
                          >
                            <span className="text-lg">🎉</span>
                            <div>
                              <p className="font-medium text-green-900 dark:text-green-300">
                                {win.achievement}
                              </p>
                              <p className="text-sm text-green-700 dark:text-green-400">
                                {win.celebration}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                                Impact: {win.impact}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Badge variant="secondary" className="gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {financialSummary.period.days} days analyzed
                </Badge>
                <Badge variant="secondary" className="gap-1.5">
                  <Target className="h-3 w-3" />
                  {financialSummary.spending_breakdown.total_categories}{" "}
                  categories
                </Badge>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Loading your financial summary...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {insights.map((insight) => (
          <Card key={insight.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight">
                    {insight.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant={
                        insight.metricDelta > 0 ? "destructive" : "default"
                      }
                      className="gap-1"
                    >
                      {insight.metricDelta > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(insight.metricDelta * 100).toFixed(0)}%
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      vs 3-month avg
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Confidence */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">
                    {(insight.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={insight.confidence * 100} className="h-2" />
              </div>

              {/* Why */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Why you're seeing this:</p>
                <ul className="space-y-1">
                  {insight.why.map((reason, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-primary mt-0.5">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              {insight.cta && (
                <Button className="w-full gap-2" variant="default">
                  {insight.cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {insights.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-muted">
              <Lightbulb className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No insights yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're analyzing your spending patterns. Check back soon for
              personalized recommendations.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
