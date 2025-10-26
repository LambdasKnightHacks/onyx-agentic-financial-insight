"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Plus, Loader2, ChevronDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Account } from "@/lib/types"

interface AddTransactionDialogProps {
  accounts: Account[]
  onTransactionAdded: () => void
}

export function AddTransactionDialog({ accounts, onTransactionAdded }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [showAdvanced, setShowAdvanced] = useState(false)

  const [formData, setFormData] = useState({
    account_id: "",
    amount: "",
    merchant_name: "",
    merchant: "",
    description: "",
    category: "",
    subcategory: "",
    posted_at: new Date().toISOString().split('T')[0], // Today's date 
    authorized_date: "",
    pending: false,
    payment_channel: "",
    source: "plaid",
    status: "processed",
    currency: "USD",
    location_city: "",
    location_state: "",
    geo_lat: "",
    geo_lon: "",
    mcc: "",
    category_confidence: "",
    fraud_score: "",
    category_reason: "",
    plaid_transaction_id: "",
    hash: "",
    raw_data: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Convert amount to negative for expenses (positive for income)
      const amount = parseFloat(formData.amount)
      if (isNaN(amount)) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid number for the amount",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Parse optional numeric fields
      const geoLat = formData.geo_lat ? parseFloat(formData.geo_lat) : null
      const geoLon = formData.geo_lon ? parseFloat(formData.geo_lon) : null
      const mcc = formData.mcc ? parseInt(formData.mcc) : null
      const categoryConfidence = formData.category_confidence ? parseFloat(formData.category_confidence) : null
      const fraudScore = formData.fraud_score ? parseFloat(formData.fraud_score) : null

      // Parse raw data if provided
      let rawData = null
      if (formData.raw_data) {
        try {
          rawData = JSON.parse(formData.raw_data)
        } catch (e) {
          toast({
            title: "Invalid JSON",
            description: "The raw data field must be valid JSON",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      }

      const transactionData = {
        account_id: formData.account_id || null,
        amount: amount,
        merchant_name: formData.merchant_name,
        merchant: formData.merchant || formData.merchant_name || null,
        description: formData.description || formData.merchant_name,
        category: formData.category || "Uncategorized",
        subcategory: formData.subcategory || null,
        posted_at: new Date(formData.posted_at).toISOString(),
        authorized_date: formData.authorized_date ? new Date(formData.authorized_date).toISOString() : null,
        pending: formData.pending,
        payment_channel: formData.payment_channel || null,
        source: formData.source,
        status: formData.status,
        currency: formData.currency,
        location_city: formData.location_city || null,
        location_state: formData.location_state || null,
        geo_lat: geoLat,
        geo_lon: geoLon,
        mcc: mcc,
        category_confidence: categoryConfidence,
        fraud_score: fraudScore,
        category_reason: formData.category_reason || null,
        plaid_transaction_id: formData.plaid_transaction_id || null,
        hash: formData.hash || null,
        raw: rawData,
      }

      console.log('Sending transaction data:', transactionData)

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('API Error:', error)
        const errorMessage = error.details || error.error || "Failed to add transaction"
        const fullError = error.hint ? `${errorMessage}\n\nHint: ${error.hint}` : errorMessage
        throw new Error(fullError)
      }

      toast({
        title: "Transaction added",
        description: "Your transaction has been successfully added",
      })

      // Reset form
      setFormData({
        account_id: "",
        amount: "",
        merchant_name: "",
        merchant: "",
        description: "",
        category: "",
        subcategory: "",
        posted_at: new Date().toISOString().split('T')[0],
        authorized_date: "",
        pending: false,
        payment_channel: "",
        source: "plaid",
        status: "processed",
        currency: "USD",
        location_city: "",
        location_state: "",
        geo_lat: "",
        geo_lon: "",
        mcc: "",
        category_confidence: "",
        fraud_score: "",
        category_reason: "",
        plaid_transaction_id: "",
        hash: "",
        raw_data: "",
      })
      setShowAdvanced(false)

      setOpen(false)
      onTransactionAdded()
    } catch (error) {
      console.error("Error adding transaction:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add transaction",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    "Food and Drink",
    "Shopping",
    "Entertainment",
    "Transportation",
    "Bills and Utilities",
    "Healthcare",
    "Travel",
    "Personal Care",
    "Education",
    "Income",
    "Transfer",
    "Other",
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Manually add a transaction to your account. Enter negative amounts for expenses, positive for income.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="merchant_name">
                Merchant / Description <span className="text-destructive">*</span>
              </Label>
              <Input
                id="merchant_name"
                placeholder="e.g., Starbucks, Salary, etc."
                value={formData.merchant_name}
                onChange={(e) => setFormData({ ...formData, merchant_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="-50.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">Negative for expenses, positive for income</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="posted_at">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="posted_at"
                  type="date"
                  value={formData.posted_at}
                  onChange={(e) => setFormData({ ...formData, posted_at: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_id">Account</Label>
              <Select value={formData.account_id} onValueChange={(value) => setFormData({ ...formData, account_id: value })}>
                <SelectTrigger id="account_id">
                  <SelectValue placeholder="Select account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.nickname} ({account.institution}) •••• {account.last4}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger id="category">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_channel">Payment Method</Label>
                <Select value={formData.payment_channel} onValueChange={(value) => setFormData({ ...formData, payment_channel: value })}>
                  <SelectTrigger id="payment_channel">
                    <SelectValue placeholder="Select method (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="in store">In Store</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Leave empty if not applicable</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                placeholder="e.g., Coffee Shops"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional Notes</Label>
              <Textarea
                id="description"
                placeholder="Add any additional details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant (Alternative Name)</Label>
              <Input
                id="merchant"
                placeholder="Alternative merchant identifier"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="pending"
                checked={formData.pending}
                onCheckedChange={(checked) => setFormData({ ...formData, pending: checked })}
              />
              <Label htmlFor="pending" className="cursor-pointer">
                Mark as pending
              </Label>
            </div>

            
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="w-full justify-between">
                  <span>Advanced Fields</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="authorized_date">Authorized Date</Label>
                  <Input
                    id="authorized_date"
                    type="date"
                    value={formData.authorized_date}
                    onChange={(e) => setFormData({ ...formData, authorized_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                    <SelectTrigger id="source">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="plaid">Plaid</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Database only allows "manual" or "plaid"</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location_city">City</Label>
                    <Input
                      id="location_city"
                      placeholder="e.g., San Francisco"
                      value={formData.location_city}
                      onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location_state">State</Label>
                    <Input
                      id="location_state"
                      placeholder="e.g., CA"
                      value={formData.location_state}
                      onChange={(e) => setFormData({ ...formData, location_state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="geo_lat">Latitude</Label>
                    <Input
                      id="geo_lat"
                      type="number"
                      step="any"
                      placeholder="e.g., 37.7749"
                      value={formData.geo_lat}
                      onChange={(e) => setFormData({ ...formData, geo_lat: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="geo_lon">Longitude</Label>
                    <Input
                      id="geo_lon"
                      type="number"
                      step="any"
                      placeholder="e.g., -122.4194"
                      value={formData.geo_lon}
                      onChange={(e) => setFormData({ ...formData, geo_lon: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mcc">MCC (Merchant Category Code)</Label>
                  <Input
                    id="mcc"
                    type="number"
                    placeholder="e.g., 5411"
                    value={formData.mcc}
                    onChange={(e) => setFormData({ ...formData, mcc: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category_confidence">Category Confidence (0-1)</Label>
                    <Input
                      id="category_confidence"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="e.g., 0.95"
                      value={formData.category_confidence}
                      onChange={(e) => setFormData({ ...formData, category_confidence: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fraud_score">Fraud Score (0-1)</Label>
                    <Input
                      id="fraud_score"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="e.g., 0.05"
                      value={formData.fraud_score}
                      onChange={(e) => setFormData({ ...formData, fraud_score: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_reason">Category Reason</Label>
                  <Input
                    id="category_reason"
                    placeholder="Reason for categorization"
                    value={formData.category_reason}
                    onChange={(e) => setFormData({ ...formData, category_reason: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plaid_transaction_id">Plaid Transaction ID</Label>
                  <Input
                    id="plaid_transaction_id"
                    placeholder="Plaid transaction identifier"
                    value={formData.plaid_transaction_id}
                    onChange={(e) => setFormData({ ...formData, plaid_transaction_id: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hash">Transaction Hash</Label>
                  <Input
                    id="hash"
                    placeholder="Unique transaction hash"
                    value={formData.hash}
                    onChange={(e) => setFormData({ ...formData, hash: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="raw_data">Raw Data (JSON)</Label>
                  <Textarea
                    id="raw_data"
                    placeholder='{"key": "value"}'
                    value={formData.raw_data}
                    onChange={(e) => setFormData({ ...formData, raw_data: e.target.value })}
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Enter valid JSON for additional metadata</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Transaction"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

