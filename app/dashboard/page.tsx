"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Banknote, TrendingUp, TrendingDown, ShieldAlert, Lightbulb, Zap, ExternalLink } from "lucide-react"
import type { Account, Transaction, FraudAlert } from "@/lib/types"

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [accountsRes, transactionsRes, alertsRes, insightsRes] = await Promise.all([
          fetch("/api/accounts"),
          fetch("/api/transactions?limit=5"),
          fetch("/api/fraud/alerts?status=new"),
          fetch("/api/insights?limit=3"),
        ])

        const accountsData = await accountsRes.json()
        const transactionsData = await transactionsRes.json()
        const alertsData = await alertsRes.json()
        const insightsData = await insightsRes.json()

        // Handle error responses
        setAccounts(Array.isArray(accountsData) ? accountsData : [])
        setRecentTransactions(Array.isArray(transactionsData) ? transactionsData.slice(0, 5) : [])
        setAlerts(Array.isArray(alertsData) ? alertsData.slice(0, 3) : [])
        setInsights(Array.isArray(insightsData) ? insightsData.slice(0, 3) : [])
      } catch (error) {
        console.error("Failed to fetch overview data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const netWorth = accounts.reduce((sum, acc) => sum + acc.balanceCurrent, 0)
  const netWorthChange = 8.4

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
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-2">Here's a calm overview of your finances</p>
      </div>

      <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Net Worth</p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-4xl font-bold">${netWorth.toLocaleString("en-US", { minimumFractionDigits: 2 })}</h2>
              <div className="flex items-center gap-1">
                {netWorthChange > 0 ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-lg font-semibold text-green-600">+{netWorthChange}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-lg font-semibold text-red-600">{netWorthChange}%</span>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {accounts.map((account) => (
            <Card key={account.id} className="p-5">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{account.institution}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">••••{account.last4}</p>
                  </div>
                  <Badge variant={account.status === "active" ? "default" : "secondary"} className="text-xs">
                    {account.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ${Math.abs(account.balanceCurrent).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{account.nickname}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
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
                  <h3 className="font-semibold">Advice</h3>
                  <p className="text-2xl font-bold mt-1">{insights.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">insights available</p>
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
                  <h3 className="font-semibold">Alerts</h3>
                  <p className="text-2xl font-bold mt-1">{alerts.filter((a) => a.status === "new").length}</p>
                  <p className="text-sm text-muted-foreground mt-1">to review</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </a>
          </Card>

          <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
            <a href="/dashboard/automations" className="block">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-950">
                  <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Rules</h3>
                  <p className="text-2xl font-bold mt-1">12</p>
                  <p className="text-sm text-muted-foreground mt-1">actions this week</p>
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
              <div key={txn.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="space-y-1">
                  <div className="font-medium">{txn.merchant}</div>
                  <div className="text-sm text-muted-foreground">{txn.category}</div>
                </div>
                <div className="text-right space-y-1">
                  <div className={`font-semibold ${txn.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                    {txn.amount < 0 ? "-" : "+"}${Math.abs(txn.amount).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">{txn.date}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Security Alerts</h2>
            <Button variant="ghost" size="sm" asChild>
              <a href="/dashboard/alerts">View all</a>
            </Button>
          </div>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <ShieldAlert className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-sm font-medium">All clear!</p>
                <p className="text-sm text-muted-foreground mt-1">No security alerts at this time</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-4 py-3 border-b last:border-0">
                  <div
                    className={`p-2 rounded-lg ${
                      alert.severity === "high"
                        ? "bg-red-100 dark:bg-red-950"
                        : alert.severity === "medium"
                          ? "bg-yellow-100 dark:bg-yellow-950"
                          : "bg-blue-100 dark:bg-blue-950"
                    }`}
                  >
                    <ShieldAlert
                      className={`h-4 w-4 ${
                        alert.severity === "high"
                          ? "text-red-600 dark:text-red-400"
                          : alert.severity === "medium"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-blue-600 dark:text-blue-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">{alert.merchant}</div>
                    <div className="text-sm text-muted-foreground">${alert.amount.toFixed(2)}</div>
                  </div>
                  <Badge
                    variant={alert.severity === "high" ? "destructive" : "secondary"}
                    className="text-xs capitalize"
                  >
                    {alert.severity}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
