import { useState, useEffect } from "react"
import { Button } from "@/src/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Switch } from "@/src/components/ui/switch"
import type { Budget } from "@/src/lib/types"
import type { BudgetFormData } from "../types"
import { CATEGORIES, PERIODS } from "../constants"

interface BudgetDialogProps {
  open: boolean
  editingBudget: Budget | null
  onOpenChange: (open: boolean) => void
  onSave: (formData: BudgetFormData) => Promise<void>
}

const defaultFormData: BudgetFormData = {
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
}

export function BudgetDialog({ open, editingBudget, onOpenChange, onSave }: BudgetDialogProps) {
  const [formData, setFormData] = useState<BudgetFormData>(defaultFormData)

  useEffect(() => {
    if (editingBudget) {
      setFormData({
        category: editingBudget.category,
        subcategory: editingBudget.subcategory || "",
        label: editingBudget.label || "",
        period: editingBudget.period,
        cap_amount: editingBudget.cap_amount.toString(),
        currency: editingBudget.currency,
        start_on: editingBudget.start_on,
        rollover: editingBudget.rollover || false,
        priority: editingBudget.priority,
        is_active: editingBudget.is_active
      })
    } else {
      setFormData(defaultFormData)
    }
  }, [editingBudget, open])

  const handleSave = async () => {
    await onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.category || !formData.cap_amount}
          >
            {editingBudget ? "Update" : "Create"} Budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

