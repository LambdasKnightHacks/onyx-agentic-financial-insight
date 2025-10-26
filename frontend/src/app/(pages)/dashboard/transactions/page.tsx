"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Activity } from "lucide-react";
import type { Transaction, Account } from "@/src/lib/types";
import { useWebSocket } from "@/src/components/hooks/useWebSocket";
import { useAuth } from "@/src/components/auth-context";
import { TransactionDetailsSheet, LiveAnalysisPanel, TestTransactionButton, TransactionFilters, TransactionList } from "./components";

export default function TransactionsPage() {
  const { user } = useAuth();
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
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editedCategory, setEditedCategory] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // WebSocket integration
  const { isConnected, isAnalyzing, agentResults, connect, startAnalysis } =
    useWebSocket(user?.id);

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

  // Fetch initial data
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

  // Transaction detail handlers
  const openDetails = (txn: Transaction) => {
    setSelectedTransaction(txn);
    setDetailsOpen(true);
    setIsEditingCategory(false);
    setEditedCategory(txn.category);
  };

  const handleRecategorize = () => {
    setIsEditingCategory(true);
  };

  const handleCancelEdit = () => {
    setIsEditingCategory(false);
    setEditedCategory(selectedTransaction?.category || "");
  };

  const handleSaveCategory = async () => {
    if (!selectedTransaction || !editedCategory) return;

    setIsSavingCategory(true);
    try {
      const response = await fetch(`/api/transactions/${selectedTransaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: editedCategory }),
      });

      if (response.ok) {
        // Update local state
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === selectedTransaction.id
              ? { ...t, category: editedCategory }
              : t
          )
        );
        setSelectedTransaction({
          ...selectedTransaction,
          category: editedCategory,
        });
        setIsEditingCategory(false);
      } else {
        console.error("Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Standard transaction categories
  const standardCategories = [
    "Food & Dining",
    "Shopping",
    "Transportation",
    "Entertainment",
    "Bills & Utilities",
    "Healthcare",
    "Travel",
    "Education",
    "Groceries",
    "Personal Care",
    "Subscriptions",
    "Income",
    "Transfer",
    "Other"
  ];

  const existingCategories = Array.from(
    new Set(transactions.map((t) => t.category.split("/")[0]))
  );

  // Combine and deduplicate
  const categories = Array.from(
    new Set([...standardCategories, ...existingCategories])
  ).sort();

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
      {/* Header */}
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

      {/* Test Transaction Button */}
      <TestTransactionButton
        isConnected={isConnected}
        isAnalyzing={isAnalyzing}
        accounts={accounts}
        onStartAnalysis={startAnalysis}
        onTransactionCreated={(txn) => setTransactions((prev) => [txn, ...prev])}
      />

      {/* Live Analysis Panel */}
      <LiveAnalysisPanel
        isAnalyzing={isAnalyzing}
        showAnalysis={showAnalysis}
        agentResults={agentResults}
        lastAnalysisResults={lastAnalysisResults}
        targetAgents={targetAgents}
        onClose={() => setShowAnalysis(false)}
      />

      {/* Filters */}
      <TransactionFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedAccount={selectedAccount}
        onAccountChange={setSelectedAccount}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        accounts={accounts}
        categories={categories}
      />

      {/* Transaction List */}
      <TransactionList
        groupedTransactions={groupedTransactions}
        accounts={accounts}
        onTransactionClick={openDetails}
      />

      {/* Empty State */}
      {filteredTransactions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No transactions found matching your filters
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transaction Details Sheet */}
      <TransactionDetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        transaction={selectedTransaction}
        accounts={accounts}
        categories={categories}
        isEditingCategory={isEditingCategory}
        editedCategory={editedCategory}
        isSavingCategory={isSavingCategory}
        onEditCategory={setEditedCategory}
        onStartEdit={handleRecategorize}
        onCancelEdit={handleCancelEdit}
        onSaveCategory={handleSaveCategory}
      />
    </div>
  );
}
