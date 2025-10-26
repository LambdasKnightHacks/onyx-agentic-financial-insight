"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Transaction } from "@/src/lib/types";
import { Skeleton } from "@/src/components/ui/skeleton";

type SpendingOverTimeDatum = {
  name: string;
  expenses: number;
  income: number;
};

type CategoryBreakdownDatum = {
  name: string;
  value: number;
};

type BudgetProgressDatum = {
  name: string;
  used: number;
  budget: number;
};

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#facc15", "#14b8a6"];

function formatMonthLabel(date: Date) {
  return date.toLocaleString("default", { month: "short" });
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function computeSpendingOverTime(transactions: Transaction[]): SpendingOverTimeDatum[] {
  const monthly = new Map<
    string,
    { expenses: number; income: number; date: Date }
  >();

  transactions.forEach((txn) => {
    const date = parseDate(txn.date);
    if (!date) return;

    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!monthly.has(key)) {
      monthly.set(key, { expenses: 0, income: 0, date });
    }

    const entry = monthly.get(key)!;
    if (txn.amount < 0) {
      entry.expenses += Math.abs(txn.amount);
    } else {
      entry.income += txn.amount;
    }
  });

  return Array.from(monthly.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-6)
    .map((entry) => ({
      name: formatMonthLabel(entry.date),
      expenses: round(entry.expenses),
      income: round(entry.income),
    }));
}

function computeCategoryBreakdown(transactions: Transaction[]): CategoryBreakdownDatum[] {
  const categories = new Map<string, number>();

  transactions.forEach((txn) => {
    if (txn.amount >= 0) return;
    const category = txn.category?.split("/")[0]?.trim() || "Uncategorized";
    categories.set(category, (categories.get(category) || 0) + Math.abs(txn.amount));
  });

  return Array.from(categories.entries())
    .map(([name, value]) => ({ name, value: round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

function computeBudgetProgress(transactions: Transaction[]): BudgetProgressDatum[] {
  if (transactions.length === 0) return [];

  const now = new Date();
  const currentKey = `${now.getFullYear()}-${now.getMonth()}`;

  const perCategory = new Map<string, Map<string, number>>();

  transactions.forEach((txn) => {
    if (txn.amount >= 0) return;
    const date = parseDate(txn.date);
    if (!date) return;

    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const category = txn.category?.split("/")[0]?.trim() || "Uncategorized";

    if (!perCategory.has(category)) {
      perCategory.set(category, new Map());
    }

    const monthMap = perCategory.get(category)!;
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + Math.abs(txn.amount));
  });

  const results: BudgetProgressDatum[] = [];

  perCategory.forEach((months, category) => {
    const currentSpend = months.get(currentKey) || 0;
    if (currentSpend === 0) return;

    const historicalEntries = Array.from(months.entries()).filter(
      ([key]) => key !== currentKey,
    );

    const historicalTotal = historicalEntries.reduce(
      (sum, [, value]) => sum + value,
      0,
    );

    const historicalAvg =
      historicalEntries.length > 0
        ? historicalTotal / historicalEntries.length
        : currentSpend;

    const budget = Math.max(historicalAvg * 1.1, currentSpend * 1.2);

    results.push({
      name: category,
      used: round(currentSpend),
      budget: round(budget),
    });
  });

  return results
    .sort((a, b) => b.used - a.used)
    .slice(0, 5);
}

export function useTransactionAnalytics() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchTransactions = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/transactions");
      if (!response.ok) {
        throw new Error("Unable to load transactions");
      }
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setError(
        err instanceof Error ? err.message : "Something went wrong while fetching data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const spendingOverTimeData = React.useMemo(
    () => computeSpendingOverTime(transactions),
    [transactions],
  );
  const categoryBreakdownData = React.useMemo(
    () => computeCategoryBreakdown(transactions),
    [transactions],
  );
  const budgetProgressData = React.useMemo(
    () => computeBudgetProgress(transactions),
    [transactions],
  );

  return {
    transactions,
    loading,
    error,
    spendingOverTimeData,
    categoryBreakdownData,
    budgetProgressData,
    refresh: fetchTransactions,
  };
}

export function SpendingOverTimeChart({
  data,
}: {
  data: SpendingOverTimeDatum[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No transaction history yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} />
        <Line type="monotone" dataKey="expenses" stroke="#3b82f6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryBreakdownChart({
  data,
}: {
  data: CategoryBreakdownDatum[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Add transactions to see category insights.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function BudgetProgressBar({ name, used, budget }: BudgetProgressDatum) {
  const percentage = budget > 0 ? Math.min((used / budget) * 100, 999) : 0;

  const color =
    percentage >= 100 ? "bg-red-500" : percentage >= 80 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{name}</span>
        <span className="text-muted-foreground">
          ${used.toFixed(2)} / ${budget.toFixed(2)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{percentage.toFixed(0)}% of budget used</p>
    </div>
  );
}

export function BudgetProgressBars({ data }: { data: BudgetProgressDatum[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">We need more spending history to model budgets.</p>;
  }

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <BudgetProgressBar key={item.name} {...item} />
      ))}
    </div>
  );
}

export default function GraphsSidebar() {
  const { loading, error, spendingOverTimeData, categoryBreakdownData, budgetProgressData } =
    useTransactionAnalytics();

  return (
    <aside className="flex h-full w-[380px] flex-col gap-8 border-l border-border bg-muted/20 p-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Graphs</h2>
        <p className="text-sm text-muted-foreground">
          A quick snapshot of your spending patterns and budgets.
        </p>
      </div>

      {loading && (
        <div className="space-y-6">
          <Skeleton className="h-[280px] w-full rounded-lg" />
          <Skeleton className="h-[280px] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-16 w-full rounded" />
            <Skeleton className="h-16 w-full rounded" />
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Spending Over Time
            </h3>
            <SpendingOverTimeChart data={spendingOverTimeData} />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Category Breakdown
            </h3>
            <CategoryBreakdownChart data={categoryBreakdownData} />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Budget Progress
            </h3>
            <BudgetProgressBars data={budgetProgressData} />
          </div>
        </>
      )}
    </aside>
  );
}
