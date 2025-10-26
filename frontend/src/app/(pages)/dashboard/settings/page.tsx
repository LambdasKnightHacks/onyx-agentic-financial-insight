"use client"

import { useEffect, useState } from "react"
import { Card } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Database, Trash2 } from "lucide-react"
import { AddAccountDialog } from "@/src/components/add-account"
import { useToast } from "@/src/components/hooks/use-toast"
import type { Account } from "@/src/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog"

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/accounts")
      if (!response.ok) {
        throw new Error("Failed to fetch accounts")
      }
      const data = await response.json()
      setAccounts(data)
    } catch (error) {
      console.error("Error fetching accounts:", error)
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/accounts?id=${accountId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete account")
      }

      toast({
        title: "Account deleted",
        description: "Your account has been successfully removed.",
      })

      fetchAccounts()
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setAccountToDelete(null)
    }
  }

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(balance)
  }

  const getAccountTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences and privacy settings</p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Connected Accounts</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage your linked bank accounts</p>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading accounts...
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No accounts yet. Add your first account to get started.
              </div>
            ) : (
              accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{account.nickname}</p>
                      <Badge variant="outline" className="text-xs">
                        {getAccountTypeLabel(account.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {account.institution} •{" "}
                      {account.last4 ? `****${account.last4}` : "No account number"}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      Balance: {formatBalance(account.balanceCurrent)}
                      {account.balanceAvailable !== undefined &&
                        account.balanceAvailable !== account.balanceCurrent && (
                          <span className="text-muted-foreground ml-2">
                            (Available: {formatBalance(account.balanceAvailable)})
                          </span>
                        )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{account.status}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setAccountToDelete(account.id)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            <AddAccountDialog onAccountAdded={fetchAccounts} />
          </div>
        </Card>

        

        
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this account and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => accountToDelete && handleDeleteAccount(accountToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
