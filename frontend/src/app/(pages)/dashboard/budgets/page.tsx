"use client"

import { useEffect, useState } from "react"
import { Card } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Switch } from "@/src/components/ui/switch"
import { Skeleton } from "@/src/components/ui/skeleton"
import { DollarSign, Plus, Edit2, Trash2, TrendingUp,Calendar, Tag } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/src/components/ui/dialog"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import type { Budget } from "@/src/lib/types"

const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Personal Care",
  "Education",
  "Gifts & Donations",
  "Business",
  "Other"
]

const PERIODS = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" }
]

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [formData, setFormData] = useState({
    category: "",
    subcategory: "",
    label: "",
    period: "month",
    cap_amount: "",
    currency: "USD",
    start_on: new Date().toISOString().split('T')[0],
    rollover: false,
    priority: 100,
    is_active: true
  })

  useEffect(() => {
    fetchBudgets()
  }, [])

  async function fetchBudgets() {
    try {
      const res = await fetch("/api/budgets")
      const data = await res.json()
      setBudgets(data)
    } catch (error) {
      console.error("Failed to fetch budgets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget)
      setFormData({
        category: budget.category,
        subcategory: budget.subcategory || "",
        label: budget.label || "",
        period: budget.period,
        cap_amount: budget.cap_amount.toString(),
        currency: budget.currency,
        start_on: budget.start_on,
        rollover: budget.rollover || false,
        priority: budget.priority,
        is_active: budget.is_active
      })
    } else {
      setEditingBudget(null)
      setFormData({
        category: "",
        subcategory: "",
        label: "",
        period: "month",
        cap_amount: "",
        currency: "USD",
        start_on: new Date().toISOString().split('T')[0],
        rollover: false,
        priority: 100,
        is_active: true
      })
    }
    setDialogOpen(true)
  }

  const handleSaveBudget = async () => {
    try {
      const payload = {
        ...formData,
        cap_amount: parseFloat(formData.cap_amount),
        subcategory: formData.subcategory || null,
        label: formData.label || null,
      }

      if (editingBudget) {
        await fetch(`/api/budgets/${editingBudget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }
      
      setDialogOpen(false)
      fetchBudgets()
    } catch (error) {
      console.error("Failed to save budget:", error)
    }
  }

  const handleDeleteBudget = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return
    
    try {
      await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      })
      fetchBudgets()
    } catch (error) {
      console.error("Failed to delete budget:", error)
    }
  }

  const toggleBudgetActive = async (budget: Budget) => {
    try {
      await fetch(`/api/budgets/${budget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !budget.is_active }),
      })
      setBudgets(budgets.map((b) => 
        b.id === budget.id ? { ...b, is_active: !b.is_active } : b
      ))
    } catch (error) {
      console.error("Failed to toggle budget:", error)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  const formatPeriod = (period: string) => {
    const periodMap: Record<string, string> = {
      'day': 'day',
      'week': 'week',
      'month': 'month',
      'year': 'year'
    }
    return periodMap[period] || period
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground mt-2">
            Manage your spending limits across different categories
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBudget ? "Edit Budget" : "Create Budget"}
              </DialogTitle>
              <DialogDescription>
                Set spending limits for your expense categories
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => 
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    placeholder="e.g., Restaurants"
                    value={formData.subcategory}
                    onChange={(e) => 
                      setFormData({ ...formData, subcategory: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  placeholder="Optional label for this budget"
                  value={formData.label}
                  onChange={(e) => 
                    setFormData({ ...formData, label: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period">Period *</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(value) => 
                      setFormData({ ...formData, period: value })
                    }
                  >
                    <SelectTrigger id="period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cap_amount">Amount *</Label>
                  <Input
                    id="cap_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cap_amount}
                    onChange={(e) => 
                      setFormData({ ...formData, cap_amount: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_on">Start Date *</Label>
                  <Input
                    id="start_on"
                    type="date"
                    value={formData.start_on}
                    onChange={(e) => 
                      setFormData({ ...formData, start_on: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => 
                      setFormData({ ...formData, priority: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="rollover"
                  checked={formData.rollover}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, rollover: checked })
                  }
                />
                <Label htmlFor="rollover" className="cursor-pointer">
                  Allow unused budget to rollover to next period
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Budget is active
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveBudget}
                disabled={!formData.category || !formData.cap_amount}
              >
                {editingBudget ? "Update" : "Create"} Budget
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {budgets.map((budget) => (
          <Card key={budget.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {budget.category}
                      </h3>
                      {budget.subcategory && (
                        <Badge variant="secondary">
                          {budget.subcategory}
                        </Badge>
                      )}
                      {budget.label && (
                        <Badge variant="outline" className="gap-1">
                          <Tag className="h-3 w-3" />
                          {budget.label}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {formatCurrency(budget.cap_amount, budget.currency)} / {formatPeriod(budget.period)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Starts {new Date(budget.start_on).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pl-11 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Priority: {budget.priority}</span>
                  {budget.rollover && (
                    <>
                      <span>•</span>
                      <span>Rollover enabled</span>
                    </>
                  )}
                  {budget.created_at && (
                    <>
                      <span>•</span>
                      <span>
                        Created {new Date(budget.created_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDialog(budget)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteBudget(budget.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Switch
                  checked={budget.is_active}
                  onCheckedChange={() => toggleBudgetActive(budget)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {budgets.length === 0 && (
        <Card className="p-12 text-center">
          <div className="inline-flex p-3 rounded-full bg-muted mb-4">
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first budget to start tracking spending limits
          </p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Create Budget
          </Button>
        </Card>
      )}
    </div>
  )
}
