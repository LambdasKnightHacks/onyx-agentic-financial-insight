export interface BudgetSpending {
  budget_id: string
  category: string
  subcategory?: string | null
  label?: string | null
  period: string
  cap_amount: number
  spent: number
  remaining: number
  percentage: number
  is_exceeded: boolean
  period_start: string
  period_end: string
}

export interface BudgetFormData {
  category: string
  subcategory: string
  label: string
  period: string
  cap_amount: string
  currency: string
  start_on: string
  rollover: boolean
  priority: number
  is_active: boolean
}

