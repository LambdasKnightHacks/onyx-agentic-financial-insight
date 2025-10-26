import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
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

  // Helper function to generate random date within last month
  const getRandomDateInLastMonth = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get random timestamp between 30 days ago and now
    const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
    const randomDate = new Date(randomTime);
    
    return randomDate.toISOString().split("T")[0];
  };

  const handleNormalTransaction = async () => {
    // Check if we have accounts
    if (!accounts || accounts.length === 0) {
      alert("Please connect a bank account first");
      return;
    }

    const randomDate = getRandomDateInLastMonth();
    console.log("📅 Generated random date for test transaction:", randomDate);

    const normalMerchants = [
      "Amazon.com",
      "Starbucks",
      "Whole Foods",
      "Shell Gas Station",
      "Netflix",
      "Uber",
      "Costco",
      "Home Depot",
      "Target",
      "McDonald's",
    ];

    const normalCategories = [
      "Shopping",
      "Food and Drink",
      "Entertainment",
      "Education",
      "Transportation",
      "Groceries",
      "Gas Stations",
    ];

    const testTransaction = {
      plaid_transaction_id: "test_normal_" + Date.now(),
      amount: -(Math.floor(Math.random() * 500) + 25), // Negative for debit
      merchant_name: normalMerchants[Math.floor(Math.random() * normalMerchants.length)],
      description: "Test normal transaction via WebSocket",
      posted_at: randomDate,
      category: normalCategories[Math.floor(Math.random() * normalCategories.length)],
      subcategory: "General",
      account_id: accounts[Math.floor(Math.random() * accounts.length)].id,
      location_city: "San Francisco",
      location_state: "CA",
      payment_channel: "online",
      is_test_transaction: true,
    };

    console.log("Step 1: Creating normal transaction in database...");

    try {
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
        "Step 2: Normal transaction created successfully:",
        createdTransaction.id
      );

      console.log("Step 3: Starting AI analysis...");
      onStartAnalysis(testTransaction);

      onTransactionCreated(createdTransaction);
    } catch (error) {
      console.error("Error in test transaction flow:", error);
      alert("Error creating test transaction. Check console for details.");
    }
  };

  const handleSketchyTransaction = async () => {
    // Check if we have accounts
    if (!accounts || accounts.length === 0) {
      alert("Please connect a bank account first");
      return;
    }

    const randomDate = getRandomDateInLastMonth();
    console.log("📅 Generated random date for sketchy transaction:", randomDate);

    const sketchyMerchants = [
      "BTC-EXCHANGE-INC",
      "CRYPTO-WALLET.NET",
      "CASINO-ROYALE-ONLINE",
      "PRIVATE-ESCORT-SVC",
      "INTERNATIONAL-WIRE-XFER",
      "UNKNOWN-MERCHANT-XXXX",
      "PREPAID-CARD-LOAD",
      "OVERSEAS-TRANSFER-INTL",
      "P2P-EXCHANGE-BTC-USD",
      "HIDDEN-MERCHANT-4567",
    ];

    const sketchyDescriptions = [
      "International Wire Transfer",
      "Cryptocurrency Exchange Purchase",
      "Anonymous Prepaid Card Load",
      "P2P Transfer to Unknown Account",
      "Offshore Bank Transfer",
      "Cash Advance - ATM",
      "Suspicious Recurring Charge",
      "High-Risk Merchant Transaction",
      "Multiple Small Test Transactions",
      "Unusual Foreign Transaction",
    ];

    const testTransaction = {
      plaid_transaction_id: "test_sketchy_" + Date.now(),
      amount: -(Math.floor(Math.random() * 5000) + 100), // Larger amounts for suspicious transactions
      merchant_name: sketchyMerchants[Math.floor(Math.random() * sketchyMerchants.length)],
      description: sketchyDescriptions[Math.floor(Math.random() * sketchyDescriptions.length)],
      posted_at: randomDate,
      category: "Miscellaneous",
      subcategory: "Other",
      account_id: accounts[Math.floor(Math.random() * accounts.length)].id,
      location_city: ["Singapore", "Moscow", "Dubai", "Caracas", "Unknown"][Math.floor(Math.random() * 5)],
      location_state: "XX",
      location_country: "XX",
      payment_channel: "other",
      is_test_transaction: true,
    };

    console.log("Step 1: Creating sketchy transaction in database...");

    try {
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
        "Step 2: Sketchy transaction created successfully:",
        createdTransaction.id
      );

      console.log("Step 3: Starting AI analysis...");
      onStartAnalysis(testTransaction);

      onTransactionCreated(createdTransaction);
    } catch (error) {
      console.error("Error in test transaction flow:", error);
      alert("Error creating test transaction. Check console for details.");
    }
  };

  return (
    <Card className="border-primary/20 bg-linear-to-r from-primary/5 to-primary/10">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
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
                Simulate transactions to test AI fraud detection
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleNormalTransaction}
              disabled={isAnalyzing || !accounts || accounts.length === 0}
              className="flex-1 shrink-0"
              size="lg"
              variant="outline"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Generate Normal Charge
                </>
              )}
            </Button>
            
            <Button
              onClick={handleSketchyTransaction}
              disabled={isAnalyzing || !accounts || accounts.length === 0}
              className="flex-1 shrink-0"
              size="lg"
              variant="destructive"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Generate Sketchy Charge
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

