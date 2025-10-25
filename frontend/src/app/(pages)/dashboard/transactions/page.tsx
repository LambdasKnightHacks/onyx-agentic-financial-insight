"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Progress } from "@/src/components/ui/progress";
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  CreditCard,
  AlertTriangle,
  Activity,
  Loader2,
} from "lucide-react";
import type { Transaction, Account } from "@/src/lib/types";
import { useWebSocket } from "@/src/components/hooks/useWebSocket";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [lastAnalysisResults, setLastAnalysisResults] = useState<
    Record<string, any>
  >({});

  // WebSocket integration
  const { isConnected, isAnalyzing, agentResults, connect, startAnalysis } =
    useWebSocket();

  const targetAgents = [
    { name: "categorization_agent", icon: "🏷️", display: "Categorization" },
    { name: "fraud_agent", icon: "🛡️", display: "Fraud Detection" },
    { name: "budget_agent", icon: "💰", display: "Budget Analysis" },
    { name: "cashflow_agent", icon: "📈", display: "Cash Flow" },
    { name: "synthesizer_agent", icon: "💡", display: "Summary" },
  ];

  // Auto-connect to WebSocket on mount
  useEffect(() => {
    if (!isConnected) {
      connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track analysis state and save results
  useEffect(() => {
    if (isAnalyzing) {
      setShowAnalysis(true);
    } else if (showAnalysis && Object.keys(agentResults).length > 0) {
      // Analysis just completed, save the results
      setLastAnalysisResults(agentResults);

      // Refresh transactions to show the new one
      const refreshTransactions = async () => {
        try {
          const txnRes = await fetch("/api/transactions");
          const txnData = await txnRes.json();
          setTransactions(Array.isArray(txnData) ? txnData : []);
        } catch (error) {
          console.error("Failed to refresh transactions:", error);
        }
      };
      refreshTransactions();

      // Keep showing for 10 seconds after completion
      const timer = setTimeout(() => {
        setShowAnalysis(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isAnalyzing, agentResults, showAnalysis]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txnRes, accRes] = await Promise.all([
          fetch("/api/transactions"),
          fetch("/api/accounts"),
        ]);
        const txnData = await txnRes.json();
        const accData = await accRes.json();

        setTransactions(Array.isArray(txnData) ? txnData : []);
        setAccounts(Array.isArray(accData) ? accData : []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch = txn.merchant
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesAccount =
      selectedAccount === "all" || txn.accountId === selectedAccount;
    const matchesCategory =
      selectedCategory === "all" || txn.category.includes(selectedCategory);
    return matchesSearch && matchesAccount && matchesCategory;
  });

  // Group transactions by account
  const groupedTransactions = filteredTransactions.reduce((acc, txn) => {
    if (!acc[txn.accountId]) {
      acc[txn.accountId] = [];
    }
    acc[txn.accountId].push(txn);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const getAccountById = (accountId: string) => {
    return accounts.find((acc) => acc.id === accountId);
  };

  const openDetails = (txn: Transaction) => {
    setSelectedTransaction(txn);
    setDetailsOpen(true);
  };

  const categories = Array.from(
    new Set(transactions.map((t) => t.category.split("/")[0]))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your recent transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Activity
            className={`h-4 w-4 ${
              isConnected ? "text-green-500" : "text-muted-foreground"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      {/* Test Transaction Button - Development Tool */}
      {isConnected && (
        <Card className="border-primary/20 bg-linear-to-r from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M12 2v4" />
                    <path d="m12 18 4 4-4 4-4-4 4-4Z" />
                    <path d="M12 6v12" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Test Live Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Simulate a transaction to see AI agents in action
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  const testTransaction = {
                    plaid_transaction_id: "test_websocket_" + Date.now(),
                    amount: Math.floor(Math.random() * 500) + 25,
                    merchant_name: [
                      "Amazon.com",
                      "Starbucks",
                      "Whole Foods",
                      "Shell Gas Station",
                      "Netflix",
                      "Uber",
                    ][Math.floor(Math.random() * 6)],
                    description: "Test transaction",
                    posted_at: new Date().toISOString().split("T")[0],
                    category: "Shopping",
                    subcategory: "General",
                    account_id: accounts[0]?.id || "test-account",
                    location_city: "San Francisco",
                    location_state: "CA",
                    payment_channel: "online",
                    transaction_type: "debit",
                  };

                  console.log("Starting test analysis:", testTransaction);
                  startAnalysis(testTransaction);
                }}
                disabled={isAnalyzing}
                className="shrink-0"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Run Test Transaction
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Analysis Section - Shows when analyzing or recently completed */}
      {showAnalysis && (
        <Card
          className={`overflow-hidden transition-all duration-500 ${
            isAnalyzing
              ? "border-primary/30 bg-linear-to-br from-primary/5 via-primary/3 to-background"
              : "border-green-500/30 bg-linear-to-br from-green-50/50 via-background to-background"
          }`}
        >
          <div
            className={`h-1 ${
              isAnalyzing ? "bg-primary" : "bg-green-500"
            } transition-colors duration-500`}
          >
            {isAnalyzing && (
              <div className="h-full bg-primary/50 animate-pulse" />
            )}
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    isAnalyzing ? "bg-primary/10" : "bg-green-500/10"
                  }`}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-green-500"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {isAnalyzing
                      ? "AI Analysis in Progress"
                      : "Analysis Complete"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isAnalyzing
                      ? "Multiple agents processing your transaction"
                      : "All agents finished • Results ready"}
                  </CardDescription>
                </div>
              </div>
              {!isAnalyzing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnalysis(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {targetAgents.map((agent) => {
                const result = isAnalyzing
                  ? agentResults[agent.name]
                  : lastAnalysisResults[agent.name];
                const isCompleted = !!result;
                const isProcessing = isAnalyzing && !isCompleted;

                return (
                  <div
                    key={agent.name}
                    className={`group relative p-4 rounded-xl border transition-all duration-300 ${
                      isCompleted
                        ? "border-green-500/30 bg-green-50/50 hover:border-green-500/50 hover:shadow-sm"
                        : isProcessing
                        ? "border-primary/30 bg-primary/5 animate-pulse"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    <div className="text-center space-y-2">
                      <div className="text-3xl">{agent.icon}</div>
                      <div className="text-xs font-medium text-foreground/90">
                        {agent.display}
                      </div>
                      {isProcessing && (
                        <div className="flex items-center justify-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          <span className="text-[10px] text-primary font-medium">
                            Processing
                          </span>
                        </div>
                      )}
                      {isCompleted && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-green-600"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span className="text-xs text-green-600 font-semibold">
                              Done
                            </span>
                          </div>
                          {result.ui_data && (
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              {result.ui_data.display_title && (
                                <div className="font-medium text-foreground/80 truncate">
                                  {result.ui_data.display_title}
                                </div>
                              )}
                              {result.ui_data.confidence_percentage && (
                                <div className="text-[10px] text-muted-foreground">
                                  {result.ui_data.confidence_percentage}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {!isProcessing && !isCompleted && (
                        <div className="text-[10px] text-muted-foreground">
                          Waiting...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
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

      
      <div className="space-y-6">
        {Object.entries(groupedTransactions).map(([accountId, txns]) => {
          const account = getAccountById(accountId);

          return (
            <Card key={accountId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {account?.institution || "Unknown Account"}
                      </CardTitle>
                      <CardDescription>
                        {account?.nickname || "Account"} ••••{" "}
                        {account?.last4 || "****"}
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
                            <p className="font-medium truncate">
                              {txn.merchant}
                            </p>
                            {txn.labels.includes("flagged") && (
                              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              {new Date(txn.date).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span className="truncate">{txn.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p
                          className={`font-semibold ${
                            txn.amount > 0
                              ? "text-green-500"
                              : "text-foreground"
                          }`}
                        >
                          {txn.amount > 0 ? "+" : ""}$
                          {Math.abs(txn.amount).toFixed(2)}
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
          );
        })}
      </div>

      {filteredTransactions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No transactions found matching your filters
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transaction Details*/}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedTransaction && (
            <>
              <SheetHeader>
                <SheetTitle>Transaction Details</SheetTitle>
                <SheetDescription>
                  {new Date(selectedTransaction.date).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Amount */}
                <div className="text-center py-6 border-b">
                  <p
                    className={`text-4xl font-bold ${
                      selectedTransaction.amount > 0
                        ? "text-green-500"
                        : "text-foreground"
                    }`}
                  >
                    {selectedTransaction.amount > 0 ? "+" : ""}$
                    {Math.abs(selectedTransaction.amount).toFixed(2)}
                  </p>
                  <p className="text-muted-foreground mt-2">
                    {selectedTransaction.merchant}
                  </p>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">
                      {selectedTransaction.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account</p>
                    <p className="font-medium">
                      {getAccountById(selectedTransaction.accountId)
                        ?.nickname || "Unknown"}{" "}
                      ••••{" "}
                      {getAccountById(selectedTransaction.accountId)?.last4 ||
                        "****"}
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
                        <p className="font-medium">
                          {selectedTransaction.raw.location}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agent Analysis */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">AI Analysis</h3>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">
                        Category Confidence
                      </p>
                      <p className="text-sm font-medium">
                        {(
                          selectedTransaction.agent.categoryConfidence * 100
                        ).toFixed(0)}
                        %
                      </p>
                    </div>
                    <Progress
                      value={selectedTransaction.agent.categoryConfidence * 100}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">
                        Fraud Risk Score
                      </p>
                      <p className="text-sm font-medium">
                        {(selectedTransaction.agent.fraudScore * 100).toFixed(
                          0
                        )}
                        %
                      </p>
                    </div>
                    <Progress
                      value={selectedTransaction.agent.fraudScore * 100}
                      className="[&>div]:bg-destructive"
                    />
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Explanations
                    </p>
                    <ul className="space-y-1">
                      {selectedTransaction.agent.explanations.map(
                        (exp, idx) => (
                          <li
                            key={idx}
                            className="text-sm flex items-start gap-2"
                          >
                            <span className="text-primary mt-1">•</span>
                            <span>{exp}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>

                {/* Raw Data */}
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="font-semibold">Technical Details</h3>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>Transaction ID: {selectedTransaction.id}</p>
                    <p>
                      Plaid ID: {selectedTransaction.raw.plaidTransactionId}
                    </p>
                    {selectedTransaction.raw.mcc && (
                      <p>MCC: {selectedTransaction.raw.mcc}</p>
                    )}
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
  );
}
