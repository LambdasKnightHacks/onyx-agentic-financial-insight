"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useToast } from "@/components/hooks/use-toast"

interface AddAccountDialogProps {
  onAccountAdded?: () => void
  trigger?: React.ReactNode
}

export function AddAccountDialog({ onAccountAdded, trigger }: AddAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: "",
    institution: "",
    type: "checking" as "checking" | "savings" | "credit" | "loan",
    last4: "",
    balanceCurrent: "",
    balanceAvailable: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          institution: formData.institution,
          type: formData.type,
          last4: formData.last4 || null,
          balanceCurrent: parseFloat(formData.balanceCurrent) || 0,
          balanceAvailable: formData.balanceAvailable 
            ? parseFloat(formData.balanceAvailable) 
            : parseFloat(formData.balanceCurrent) || 0,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create account")
      }

      toast({
        title: "Account created",
        description: "Your account has been successfully added.",
      })

      // Reset form
      setFormData({
        name: "",
        institution: "",
        type: "checking",
        last4: "",
        balanceCurrent: "",
        balanceAvailable: "",
      })

      setOpen(false)
      onAccountAdded?.()
    } catch (error) {
      console.error("Error creating account:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
          <DialogDescription>
            Create a new account to track your finances.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Main Checking, Savings Account"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="institution">Institution *</Label>
              <Input
                id="institution"
                placeholder="e.g., Chase, Bank of America"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Account Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "checking" | "savings" | "credit" | "loan") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="last4">Last 4 Digits (Optional)</Label>
              <Input
                id="last4"
                placeholder="1234"
                maxLength={4}
                value={formData.last4}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "")
                  setFormData({ ...formData, last4: value })
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="balanceCurrent">Current Balance *</Label>
              <Input
                id="balanceCurrent"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.balanceCurrent}
                onChange={(e) => setFormData({ ...formData, balanceCurrent: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="balanceAvailable">Available Balance (Optional)</Label>
              <Input
                id="balanceAvailable"
                type="number"
                step="0.01"
                placeholder="Leave empty to match current balance"
                value={formData.balanceAvailable}
                onChange={(e) => setFormData({ ...formData, balanceAvailable: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                For credit cards, this represents your available credit
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

