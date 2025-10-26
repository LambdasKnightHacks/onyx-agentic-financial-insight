import { useState, useEffect } from 'react'
import type { Budget } from '@/src/lib/types'
import type { BudgetSpending, BudgetFormData } from '../types'

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [spendingData, setSpendingData] = useState<Map<string, BudgetSpending>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBudgets()
  }, [])

  async function fetchBudgets() {
    try {
      const [budgetsRes, spendingRes] = await Promise.all([
        fetch("/api/budgets"),
        fetch("/api/budgets/spending")
      ])
      
      const budgetsData = await budgetsRes.json()
      const spendingArray = await spendingRes.json()
      
      setBudgets(budgetsData)
      
      // Convert spending array to Map for easy lookup
      const spendingMap = new Map<string, BudgetSpending>()
      spendingArray.forEach((spending: BudgetSpending) => {
        spendingMap.set(spending.budget_id, spending)
      })
      setSpendingData(spendingMap)
      
      // Check and create budget alerts if any budgets are exceeded
      try {
        const response = await fetch("/api/alerts/check-budgets", {
          method: "POST",
          credentials: 'include', // Ensure cookies are sent
          headers: {
            'Content-Type': 'application/json'
          }
        })
        if (response.ok) {
          const result = await response.json()
          console.log('[Budget Alerts] Check result:', result)
          if (result.alerts_created > 0) {
            console.log('[Budget Alerts] Created', result.alerts_created, 'new alerts')
          }
        }
      } catch (error) {
        console.error('[Budget Alerts] Error checking budgets:', error)
        // Don't fail the budget fetch if alert check fails
      }
    } catch (error) {
      console.error("Failed to fetch budgets:", error)
    } finally {
      setLoading(false)
    }
  }

  async function createBudget(formData: BudgetFormData) {
    const payload = {
      ...formData,
      cap_amount: parseFloat(formData.cap_amount),
      subcategory: formData.subcategory || null,
      label: formData.label || null,
    }

    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    
    await fetchBudgets()
  }

  async function updateBudget(id: string, formData: BudgetFormData) {
    const payload = {
      ...formData,
      cap_amount: parseFloat(formData.cap_amount),
      subcategory: formData.subcategory || null,
      label: formData.label || null,
    }

    await fetch(`/api/budgets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    
    await fetchBudgets()
  }

  async function deleteBudget(id: string) {
    if (!confirm("Are you sure you want to delete this budget?")) return
    
    await fetch(`/api/budgets/${id}`, {
      method: "DELETE",
    })
    
    await fetchBudgets()
  }

  async function toggleBudgetActive(budget: Budget) {
    await fetch(`/api/budgets/${budget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !budget.is_active }),
    })
    
    setBudgets(budgets.map((b) => 
      b.id === budget.id ? { ...b, is_active: !b.is_active } : b
    ))
  }

  return {
    budgets,
    spendingData,
    loading,
    createBudget,
    updateBudget,
    deleteBudget,
    toggleBudgetActive
  }
}

