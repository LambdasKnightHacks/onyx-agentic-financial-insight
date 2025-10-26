import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, CreditCard, AlertTriangle } from "lucide-react";
import type { Transaction, Account } from "@/src/lib/types";

interface TransactionListProps {
  groupedTransactions: Record<string, Transaction[]>;
  accounts: Account[];
  onTransactionClick: (transaction: Transaction) => void;
}

export function TransactionList({
  groupedTransactions,
  accounts,
  onTransactionClick,
}: TransactionListProps) {
  const getAccountById = (accountId: string) => {
    return accounts.find((acc) => acc.id === accountId);
  };

  return (
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
                    onClick={() => onTransactionClick(txn)}
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
                          txn.amount > 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {txn.amount > 0 ? "+" : "-"}$
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
  );
}

