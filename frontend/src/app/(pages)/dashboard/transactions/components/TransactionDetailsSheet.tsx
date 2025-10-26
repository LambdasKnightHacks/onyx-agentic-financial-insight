import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Loader2 } from "lucide-react";
import type { Transaction, Account } from "@/lib/types";

interface TransactionDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  accounts: Account[];
  categories: string[];
  isEditingCategory: boolean;
  editedCategory: string;
  isSavingCategory: boolean;
  onEditCategory: (category: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveCategory: () => void;
}

export function TransactionDetailsSheet({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
  isEditingCategory,
  editedCategory,
  isSavingCategory,
  onEditCategory,
  onStartEdit,
  onCancelEdit,
  onSaveCategory,
}: TransactionDetailsSheetProps) {
  if (!transaction) return null;

  const getAccountById = (accountId: string) => {
    return accounts.find((acc) => acc.id === accountId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Transaction Details</SheetTitle>
          <SheetDescription>
            {new Date(transaction.date).toLocaleDateString("en-US", {
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
                transaction.amount > 0 ? "text-green-500" : "text-foreground"
              }`}
            >
              {transaction.amount > 0 ? "+" : ""}$
              {Math.abs(transaction.amount).toFixed(2)}
            </p>
            <p className="text-muted-foreground mt-2">{transaction.merchant}</p>
          </div>

          {/* Basic Info */}
          <div className="space-y-4 text-center max-w-sm mx-auto">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Category</p>
              {isEditingCategory ? (
                <div className="space-y-2">
                  <Select value={editedCategory} onValueChange={onEditCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={onSaveCategory}
                      disabled={isSavingCategory}
                      className="flex-1"
                    >
                      {isSavingCategory ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCancelEdit}
                      disabled={isSavingCategory}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="font-medium">{transaction.category}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account</p>
              <p className="font-medium">
                {getAccountById(transaction.accountId)?.nickname || "Unknown"}{" "}
                ••••{" "}
                {getAccountById(transaction.accountId)?.last4 || "****"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="outline" className="mt-1">
                {transaction.status}
              </Badge>
            </div>
            {transaction.raw.location && (
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground"/>
                  <p className="font-medium">{transaction.raw.location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={onStartEdit}
              disabled={isEditingCategory}
            >
              Recategorize
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

