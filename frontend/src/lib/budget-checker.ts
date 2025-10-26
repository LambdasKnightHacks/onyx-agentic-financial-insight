import { supabaseAdmin } from './supabase'

// budget calculation for UI
export function calculatePeriodDates(
  startOn: string,
  period: 'day' | 'week' | 'month' | 'year',
  transactionDate: string
): { periodStart: string; periodEnd: string } {
  const txDate = new Date(transactionDate)
  const startDate = new Date(startOn)
  
  let periodStart: Date
  let periodEnd: Date

  switch (period) {
    case 'day': {
      // Current day (00:00:00 to 23:59:59)
      periodStart = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate())
      periodEnd = new Date(periodStart)
      periodEnd.setDate(periodEnd.getDate() + 1)
      break
    }
    
    case 'week': {
      // Week starts on the same day as the budget start_on
      // Find the most recent occurrence of that day of week
      const startDayOfWeek = startDate.getDay()
      const txDayOfWeek = txDate.getDay()
      const daysBack = (txDayOfWeek - startDayOfWeek + 7) % 7
      
      periodStart = new Date(txDate)
      periodStart.setDate(txDate.getDate() - daysBack)
      periodStart.setHours(0, 0, 0, 0)
      
      periodEnd = new Date(periodStart)
      periodEnd.setDate(periodEnd.getDate() + 7)
      break
    }
    
    case 'month': {

      
      // Calculate days since start date
      const daysSinceStart = Math.floor((txDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceStart <= 30) {
        periodStart = new Date(startDate)
        periodStart.setHours(0, 0, 0, 0)
        periodEnd = new Date(txDate)
        periodEnd.setHours(23, 59, 59, 999)
      } else {
        // show current rolling 30-day period
        const periodNumber = Math.floor(daysSinceStart / 30)
        const periodStartTime = startDate.getTime() + (periodNumber * 30 * 24 * 60 * 60 * 1000)
        periodStart = new Date(periodStartTime)
        periodStart.setHours(0, 0, 0, 0)
        
        periodEnd = new Date(periodStart)
        periodEnd.setDate(periodEnd.getDate() + 30)
        periodEnd.setHours(0, 0, 0, 0)
      }
      
      break
    }
    
    case 'year': {
      // Yearly period starting on the same month/day as start_on
      const startMonth = startDate.getMonth()
      const startDay = startDate.getDate()
      const txMonth = txDate.getMonth()
      const txDay = txDate.getDate()
      
      // Determine if we're in the current budget year or the previous one
      if (txMonth > startMonth || (txMonth === startMonth && txDay >= startDay)) {
        // Current budget year
        periodStart = new Date(txDate.getFullYear(), startMonth, startDay)
      } else {
        // Previous budget year
        periodStart = new Date(txDate.getFullYear() - 1, startMonth, startDay)
      }
      
      periodEnd = new Date(periodStart)
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      break
    }
    
    default:
      // Fallback to calendar month
      periodStart = new Date(txDate.getFullYear(), txDate.getMonth(), 1)
      periodEnd = new Date(txDate.getFullYear(), txDate.getMonth() + 1, 1)
  }

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString()
  }
}

// current spending for all budgets for a user
export async function getBudgetSpendingSummary(userId: string) {
  try {
    const { data: budgets, error: budgetError } = await supabaseAdmin
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('category', { ascending: true })

    if (budgetError || !budgets) {
      return []
    }

    const summaries = await Promise.all(
      budgets.map(async (budget) => {
        const now = new Date().toISOString()
        const { periodStart, periodEnd } = calculatePeriodDates(
          budget.start_on,
          budget.period,
          now
        )

        let transactionQuery = supabaseAdmin
          .from('transactions')
          .select('amount')
          .eq('user_id', userId)
          .eq('category', budget.category)
          .gte('posted_at', periodStart)
          .lt('posted_at', periodEnd)
          .eq('pending', false)

        if (budget.subcategory) {
          transactionQuery = transactionQuery.eq('subcategory', budget.subcategory)
        }

        const { data: transactions } = await transactionQuery

        const totalSpent = (transactions || []).reduce(
          (sum, tx) => sum + Math.abs(tx.amount),
          0
        )

        const percentage = (totalSpent / budget.cap_amount) * 100
        const remaining = budget.cap_amount - totalSpent  // Can be negative when exceeded

        return {
          budget_id: budget.id,
          category: budget.category,
          subcategory: budget.subcategory,
          label: budget.label,
          period: budget.period,
          cap_amount: budget.cap_amount,
          spent: totalSpent,
          remaining,
          percentage,
          is_exceeded: totalSpent > budget.cap_amount,
          period_start: periodStart,
          period_end: periodEnd
        }
      })
    )

    return summaries
  } catch (error) {
    console.error('Error getting budget spending summary:', error)
    return []
  }
}

