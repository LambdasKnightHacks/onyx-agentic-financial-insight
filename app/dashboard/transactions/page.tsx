"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"
import { Search, ArrowUpRight, ArrowDownRight, MapPin, CreditCard, AlertTriangle } from "lucide-react"
import type { Transaction, Account } from "@/lib/types"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAccount, setSelectedAccount] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txnRes, accRes] = await Promise.all([fetch("/api/transactions"), fetch("/api/accounts")])
        const txnData = await txnRes.json()
        const accData = await accRes.json()
        setTransactions(txnData)
        setAccounts(accData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter transactions
  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch = txn.merchant.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAccount = selectedAccount === "all" || txn.accountId === selectedAccount
    const matchesCategory = selectedCategory === "all" || txn.category.includes(selectedCategory)
    return matchesSearch && matchesAccount && matchesCategory
  })

  // Group transactions by account
  const groupedTransactions = filteredTransactions.reduce(
    (acc, txn) => {
      if (!acc[txn.accountId]) {
        acc[txn.accountId] = []
      }
      acc[txn.accountId].push(txn)
      return acc
    },
    {} as Record<string, Transaction[]>,
  )

  const getAccountById = (accountId: string) => {
    return accounts.find((acc) => acc.id === accountId)
  }

  const openDetails = (txn: Transaction) => {
    setSelectedTransaction(txn)
    setDetailsOpen(true)
  }

  const categories = Array.from(new Set(transactions.map((t) => t.category.split("/")[0])))

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground mt-1">View and manage all your recent transactions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search merchant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.nickname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions grouped by account */}
      <div className="space-y-6">
        {Object.entries(groupedTransactions).map(([accountId, txns]) => {
          const account = getAccountById(accountId)
          if (!account) return null

          return (
            <Card key={accountId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{account.institution}</CardTitle>
                      <CardDescription>
                        {account.nickname} •••• {account.last4}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">{txns.length} transactions</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {txns.map((txn) => (
                    <button
                      key={txn.id}
                      onClick={() => openDetails(txn)}
                      className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            txn.amount > 0 ? "bg-green-500/10" : "bg-muted"
                          }`}
                        >
                          {txn.amount > 0 ? (
                            <ArrowDownRight className="h-5 w-5 text-green-500" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{txn.merchant}</p>
                            {txn.labels.includes("flagged") && (
                              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{new Date(txn.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="truncate">{txn.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`font-semibold ${txn.amount > 0 ? "text-green-500" : "text-foreground"}`}>
                          {txn.amount > 0 ? "+" : ""}${Math.abs(txn.amount).toFixed(2)}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {txn.status}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTransactions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No transactions found matching your filters</p>
          </CardContent>
        </Card>
      )}

      {/* Transaction Details Drawer */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedTransaction && (
            <>
              <SheetHeader>
                <SheetTitle>Transaction Details</SheetTitle>
                <SheetDescription>
                  {new Date(selectedTransaction.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Amount */}
                <div className="text-center py-6 border-b">
                  <p
                    className={`text-4xl font-bold ${
                      selectedTransaction.amount > 0 ? "text-green-500" : "text-foreground"
                    }`}
                  >
                    {selectedTransaction.amount > 0 ? "+" : ""}${Math.abs(selectedTransaction.amount).toFixed(2)}
                  </p>
                  <p className="text-muted-foreground mt-2">{selectedTransaction.merchant}</p>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{selectedTransaction.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account</p>
                    <p className="font-medium">
                      {getAccountById(selectedTransaction.accountId)?.nickname} ••••{" "}
                      {getAccountById(selectedTransaction.accountId)?.last4}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="outline" className="mt-1">
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                  {selectedTransaction.raw.location && (
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{selectedTransaction.raw.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agent Analysis */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">AI Analysis</h3>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Category Confidence</p>
                      <p className="text-sm font-medium">
                        {(selectedTransaction.agent.categoryConfidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <Progress value={selectedTransaction.agent.categoryConfidence * 100} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Fraud Risk Score</p>
                      <p className="text-sm font-medium">{(selectedTransaction.agent.fraudScore * 100).toFixed(0)}%</p>
                    </div>
                    <Progress value={selectedTransaction.agent.fraudScore * 100} className="[&>div]:bg-destructive" />
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Explanations</p>
                    <ul className="space-y-1">
                      {selectedTransaction.agent.explanations.map((exp, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{exp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Raw Data */}
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="font-semibold">Technical Details</h3>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>Transaction ID: {selectedTransaction.id}</p>
                    <p>Plaid ID: {selectedTransaction.raw.plaidTransactionId}</p>
                    {selectedTransaction.raw.mcc && <p>MCC: {selectedTransaction.raw.mcc}</p>}
                    <p>Channel: {selectedTransaction.raw.channel}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1 bg-transparent">
                    Recategorize
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    Add Note
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
