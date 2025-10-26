"use client";

import { useEffect, useState } from "react";
import { Card } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Banknote, TrendingUp, TrendingDown, ShieldAlert, Lightbulb, DollarSign, ExternalLink } from "lucide-react";
import type { Account, Transaction } from "@/src/lib/types";
import type { Alert } from "./alerts/types";
import { getAlertTitle, getAlertIcon, getSeverityColor } from "./alerts/utils";
import { PlaidLinkButton } from "@/src/components/plaid-link-button";
import { useAuth } from "@/src/components/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [netWorthChange, setNetWorthChange] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [accountsRes, transactionsRes, alertsRes, insightsRes, budgetsRes, allTransactionsRes] =
          await Promise.all([
            fetch("/api/accounts"),
            fetch("/api/transactions?limit=3"),
            fetch("/api/alerts?status=active&limit=3"),
            fetch("/api/insights?"),
            fetch("/api/budgets?"),
            fetch("/api/transactions") // Fetch all transactions for net worth calculation
          ]);

        const accountsData = await accountsRes.json();
        const transactionsData = await transactionsRes.json();
        const alertsData = await alertsRes.json();
        const insightsData = await insightsRes.json();
        const budgetsData = await budgetsRes.json();
        const allTransactionsData = await allTransactionsRes.json();

        // Handle error responses
        setAccounts(Array.isArray(accountsData) ? accountsData : []);
        setRecentTransactions(
          Array.isArray(transactionsData) ? transactionsData.slice(0, 3) : []
        );
        setAlerts(Array.isArray(alertsData) ? alertsData.slice(0, 3) : []);
        setInsights(
          Array.isArray(insightsData) ? insightsData : []
        );
        setBudgets(
          Array.isArray(budgetsData) ? budgetsData : []
        );

        // Calculate net worth change based on last 30 days of transactions
        if (Array.isArray(allTransactionsData) && allTransactionsData.length > 0) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          // Filter transactions from last 30 days
          const recentTxns = allTransactionsData.filter((txn: Transaction) => {
            const txnDate = new Date(txn.date);
            return txnDate >= thirtyDaysAgo;
          });

          // Calculate net change 
          // Negative amounts are expenses, positive are income
          const netChange = recentTxns.reduce((sum: number, txn: Transaction) => {
            return sum - txn.amount; // Subtract because in Plaid, positive amounts are expenses
          }, 0);

          // Calculate current net worth
          const currentNetWorth = Array.isArray(accountsData) 
            ? accountsData.reduce((sum: number, acc: Account) => sum + acc.balanceCurrent, 0)
            : 0;

          // Calculate percentage change
          // Previous net worth 
          const previousNetWorth = currentNetWorth - netChange;
          
          // Calculate percentage
          // Works for both positive and negative net worth
          if (Math.abs(previousNetWorth) > 0.01) {
            const percentChange = (netChange / Math.abs(previousNetWorth)) * 100;
            setNetWorthChange(parseFloat(percentChange.toFixed(1)));
          } else if (Math.abs(currentNetWorth) > 0.01 && netChange !== 0) {
            // If previous net worth was near zero but current isn't, use current as base
            const percentChange = (netChange / Math.abs(currentNetWorth)) * 100;
            setNetWorthChange(parseFloat(percentChange.toFixed(1)));
          } else {
            setNetWorthChange(0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch overview data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const netWorth = accounts.reduce((sum, acc) => sum + acc.balanceCurrent, 0);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Get display name from user
  const getUserName = () => {
    if (!user) return "";
    const metadata = user.user_metadata;
    if (metadata?.name) return metadata.name;
    if (metadata?.full_name) return metadata.full_name;
    if (metadata?.first_name) return metadata.first_name;

    // Fall back to email if no defined name
    if (user.email) {
      return user.email.split("@")[0];
    }

    return "";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{getUserName() ? `, ${getUserName()}` : ""}
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's a calm overview of your finances
        </p>
      </div>

      {/* TEST: Plaid Link Button */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">
              Test Plaid Integration
            </h3>
            <p className="text-sm text-muted-foreground">
              Click below to connect a bank account via Plaid Link
            </p>
          </div>
          <PlaidLinkButton
            onSuccess={(accounts) => {
              console.log("Accounts connected:", accounts);
              // Refresh page
              window.location.reload();
            }}
          />
        </div>
      </Card>

      <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Total Net Worth
            </p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-4xl font-bold">
                $
                {netWorth.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </h2>
              <div className="flex items-center gap-1">
                {netWorthChange > 0 ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-lg font-semibold text-green-600">
                      +{netWorthChange}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-lg font-semibold text-red-600">
                      {netWorthChange}%
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">vs last 30 days</p>
          </div>
          <Banknote className="h-12 w-12 text-primary/40" />
        </div>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Accounts</h2>
        {accounts.length === 0 ? (
          <Card className="p-8 text-center">
            <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first account to track your finances
            </p>
            <Button asChild>
              <a href="/dashboard/settings">Add Account</a>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {accounts.map((account) => (
              <Card key={account.id} className="p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {account.institution}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ••••{account.last4}
                      </p>
                    </div>
                    <Badge
                      variant={
                        account.status === "active" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {account.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      $
                      {account.balanceCurrent.toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2 }
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {account.nickname}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
            <a href="/dashboard/insights" className="block">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950">
                  <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Insights</h3>
                  <p className="text-2xl font-bold mt-1">{insights.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    insights available
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </a>
          </Card>

          <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
            <a href="/dashboard/alerts" className="block">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950">
                  <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Recent Alerts</h3>
                  <p className="text-2xl font-bold mt-1">
                    {alerts.length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    to review
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </a>
          </Card>

          <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
            <a href="/dashboard/budgets" className="block">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-950">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Budgets</h3>
                  <p className="text-2xl font-bold mt-1">{budgets.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    active budgets
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </a>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <Button variant="ghost" size="sm" asChild>
              <a href="/dashboard/transactions">View all</a>
            </Button>
          </div>
          <div className="space-y-4">
            {recentTransactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="space-y-1">
                  <div className="font-medium">{txn.merchant}</div>
                  <div className="text-sm text-muted-foreground">
                    {txn.category}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div
                    className={`font-semibold ${
                      txn.amount < 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {txn.amount < 0 ? "-" : "+"}$
                    {Math.abs(txn.amount).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {txn.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Alerts</h2>
            <Button variant="ghost" size="sm" asChild>
              <a href="/dashboard/alerts">View all</a>
            </Button>
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <ShieldAlert className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-sm font-medium">All clear!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No alerts at this time
                </p>
              </div>
            ) : (
              alerts.map((alert) => {
                const AlertIcon = getAlertIcon(alert.type)
                const severityColors = getSeverityColor(alert.severity)
                const title = getAlertTitle(alert)
                const isBudgetAlert = alert.type === 'budget'
                const isFraudAlert = alert.type === 'fraud'
                const isCritical = alert.severity === 'critical' || alert.severity === 'high'
                
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
                      isFraudAlert && isCritical
                        ? 'bg-red-500/10 border-red-500/30 border-l-4'
                        : isFraudAlert
                        ? 'bg-orange-500/10 border-orange-500/30 border-l-4'
                        : 'border-border'
                    }`}
                  >
                    <div className={`flex-shrink-0 relative ${
                      isFraudAlert && isCritical ? 'animate-pulse' : ''
                    }`}>
                      <div className={`p-3 rounded-xl shadow-lg ${
                        isFraudAlert 
                          ? 'bg-gradient-to-br from-red-500 to-red-600' 
                          : isBudgetAlert
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                          : severityColors.bg
                      }`}>
                        <AlertIcon className="h-5 w-5 text-white" />
                      </div>
                      {isCritical && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-600 rounded-full border-2 border-background animate-ping" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-base text-foreground truncate">
                          {title}
                        </h3>
                        <Badge
                          variant={isCritical ? "destructive" : "secondary"}
                          className={`text-xs capitalize font-semibold ${
                            isCritical ? 'animate-pulse' : ''
                          }`}
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {isBudgetAlert 
                          ? alert.reason?.split(':')[0] || 'Budget alert'
                          : alert.amount !== undefined
                            ? `$${Math.abs(alert.amount).toFixed(2)}`
                            : alert.date
                        }
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
