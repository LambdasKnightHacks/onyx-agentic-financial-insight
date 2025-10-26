"use client";

import { RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import {
  useTransactionAnalytics,
  SpendingOverTimeChart,
  CategoryBreakdownChart,
  BudgetProgressBars,
} from "@/src/components/graph-sidebar";

export default function GraphsPage() {
  const {
    loading,
    error,
    spendingOverTimeData,
    categoryBreakdownData,
    budgetProgressData,
    refresh,
  } = useTransactionAnalytics();

  const hasData =
    spendingOverTimeData.length > 0 ||
    categoryBreakdownData.length > 0 ||
    budgetProgressData.length > 0;

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <div className="flex-1 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Graphs &amp; Trends
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize how your spending evolves, which categories dominate,
              and where budgets may need attention.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="self-start lg:self-auto"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && !hasData ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-[360px] rounded-xl lg:col-span-2" />
            <Skeleton className="h-[360px] rounded-xl" />
            <Skeleton className="h-[320px] rounded-xl lg:col-span-3" />
          </div>
        ) : hasData ? (
          <>
            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle>Spending vs Income (Last 6 Months)</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <SpendingOverTimeChart data={spendingOverTimeData} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Top Spending Categories</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <CategoryBreakdownChart data={categoryBreakdownData} />
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Budget Progress (Current Month)</CardTitle>
              </CardHeader>
              <CardContent>
                <BudgetProgressBars data={budgetProgressData} />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="p-12 text-center">
            <div className="space-y-2">
              <CardTitle>No transaction data yet</CardTitle>
              <p className="text-muted-foreground">
                Connect an account or add your first transaction to unlock these
                analytics.
              </p>
            </div>
          </Card>
        )}
      </div>

    </div>
  );
}
