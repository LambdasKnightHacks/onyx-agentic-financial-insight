import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Account, Transaction } from "@/src/lib/types";

interface TestTransactionButtonProps {
  isConnected: boolean;
  isAnalyzing: boolean;
  accounts: Account[];
  onStartAnalysis: (transaction: any) => void;
  onTransactionCreated: (transaction: Transaction) => void;
}

export function TestTransactionButton({
  isConnected,
  isAnalyzing,
  accounts,
  onStartAnalysis,
  onTransactionCreated,
}: TestTransactionButtonProps) {
  if (!isConnected) return null;

  const handleClick = async () => {
    // Check if we have accounts
    if (!accounts || accounts.length === 0) {
      alert("Please connect a bank account first");
      return;
    }

    const testTransaction = {
      plaid_transaction_id: "test_websocket_" + Date.now(),
      amount: -(Math.floor(Math.random() * 500) + 25), // Negative for debit
      merchant_name: [
        "Amazon.com",
        "Starbucks",
        "Whole Foods",
        "Shell Gas Station",
        "Netflix",
        "Uber",
      ][Math.floor(Math.random() * 6)],
      description: "Test transaction via WebSocket",
      posted_at: new Date().toISOString().split("T")[0],
      category: [
        "Shopping",
        "Food and Drink",
        "Entertainment",
        "Education",
        "Transportation",
        "Groceries",
      ][Math.floor(Math.random() * 6)],
      subcategory: "General",
      account_id: accounts[0].id,
      location_city: "San Francisco",
      location_state: "CA",
      payment_channel: "online",
      is_test_transaction: true, // no duplicates
    };

    console.log("Step 1: Creating transaction in database...");

    try {
      // create inside supabase
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testTransaction),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to create transaction:", errorData);
        alert(
          `Failed to create transaction: ${errorData.error || "Unknown error"}`
        );
        return;
      }

      const createdTransaction = await response.json();
      console.log(
        "Step 2: Transaction created successfully:",
        createdTransaction.id
      );

      // websocket
      console.log("Step 3: Starting AI analysis...");
      onStartAnalysis(testTransaction);

      // add transaction
      onTransactionCreated(createdTransaction);
    } catch (error) {
      console.error("Error in test transaction flow:", error);
      alert("Error creating test transaction. Check console for details.");
    }
  };

  return (
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
            onClick={handleClick}
            disabled={isAnalyzing || !accounts || accounts.length === 0}
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
  );
}

