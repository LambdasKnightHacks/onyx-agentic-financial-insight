import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Loader2, DollarSign } from "lucide-react";
import type { Account, Transaction } from "@/src/lib/types";

interface SimulateIncomeButtonProps {
  isConnected: boolean;
  isAnalyzing: boolean;
  accounts: Account[];
  onTransactionCreated: (transaction: Transaction) => void;
}

export function SimulateIncomeButton({
  isConnected,
  isAnalyzing,
  accounts,
  onTransactionCreated,
}: SimulateIncomeButtonProps) {
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

  const handleClick = async () => {
    // Check if we have accounts
    if (!accounts || accounts.length === 0) {
      alert("Please connect a bank account first");
      return;
    }

    const randomDate = getRandomDateInLastMonth();
    console.log("💰 Generated random date for income transaction:", randomDate);

    const incomeTransaction = {
      plaid_transaction_id: "test_income_" + Date.now(),
      amount: Math.floor(Math.random() * 2000) + 500, // Positive for income
      merchant_name: [
        "Payroll Deposit",
        "Freelance Payment",
        "Investment Return",
        "Consulting Fee",
        "Bonus Payment",
        "Cashback Rewards",
      ][Math.floor(Math.random() * 6)],
      description: "Simulated income transaction",
      posted_at: randomDate,
      category: "Income",
      subcategory: "Salary",
      account_id: accounts[Math.floor(Math.random() * accounts.length)].id,
      location_city: "San Francisco",
      location_state: "CA",
      payment_channel: "online",
      is_test_transaction: true,
    };

    console.log("Step 1: Creating income transaction in database...");

    try {
      // create inside supabase
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(incomeTransaction),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to create income transaction:", errorData);
        alert(
          `Failed to create income transaction: ${errorData.error || "Unknown error"}`
        );
        return;
      }

      const createdTransaction = await response.json();
      console.log(
        "Step 2: Income transaction created successfully:",
        createdTransaction.id
      );

      // Add transaction to the list
      onTransactionCreated(createdTransaction);
    } catch (error) {
      console.error("Error in simulate income flow:", error);
      alert("Error creating income transaction. Check console for details.");
    }
  };

  return (
    <Card className="border-green-500/20 bg-gradient-to-r from-green-500/5 to-green-500/10">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Simulate Income
              </h3>
              <p className="text-sm text-muted-foreground">
                Add a positive transaction to your account
              </p>
            </div>
          </div>
          <Button
            onClick={handleClick}
            disabled={isAnalyzing || !accounts || accounts.length === 0}
            className="shrink-0 bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Add Income
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

