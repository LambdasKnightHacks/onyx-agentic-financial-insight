"use client"

import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Plus } from "lucide-react"
import type { Budget } from "@/src/lib/types"
import { useBudgets } from "./hooks/useBudgets"
import { BudgetCard } from "./components/BudgetCard"
import { BudgetDialog } from "./components/BudgetDialog"
import { EmptyState } from "./components/EmptyState"
import { BudgetSkeleton } from "./components/BudgetSkeleton"
import type { BudgetFormData } from "./types"

export default function BudgetsPage() {
  const { budgets, spendingData, loading, createBudget, updateBudget, deleteBudget, toggleBudgetActive } = useBudgets()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  const handleOpenDialog = (budget?: Budget) => {
    setEditingBudget(budget || null)
    setDialogOpen(true)
  }

  const handleSaveBudget = async (formData: BudgetFormData) => {
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, formData)
      } else {
        await createBudget(formData)
      }
    } catch (error) {
      console.error("Failed to save budget:", error)
    }
  }

  if (loading) {
    return <BudgetSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground mt-2">
            Manage your spending limits across different categories
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          New Budget
        </Button>
      </div>

      {/* Budgets List */}
      {budgets.length > 0 ? (
        <div className="grid gap-4">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              spending={spendingData.get(budget.id)}
              onEdit={handleOpenDialog}
              onDelete={deleteBudget}
              onToggleActive={toggleBudgetActive}
            />
          ))}
        </div>
      ) : (
        <EmptyState onCreateBudget={() => handleOpenDialog()} />
      )}

      {/* Create/Edit Dialog */}
      <BudgetDialog
        open={dialogOpen}
        editingBudget={editingBudget}
        onOpenChange={setDialogOpen}
        onSave={handleSaveBudget}
      />
    </div>
  )
}

