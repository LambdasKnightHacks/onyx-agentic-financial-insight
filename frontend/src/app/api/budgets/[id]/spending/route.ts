import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getUserIdFromRequest } from "@/lib/auth-utils"
import { calculatePeriodDates } from "@/lib/budget-checker"

// returns specific details for a budget
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const budgetId = params.id

    // Get the budget
    const { data: budget, error: budgetError } = await supabaseAdmin
      .from('budgets')
      .select('*')
      .eq('id', budgetId)
      .eq('user_id', userId)
      .single()

    if (budgetError || !budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    // Calculate period dates
    const now = new Date()
    const { periodStart, periodEnd } = calculatePeriodDates(
      budget.start_on,
      budget.period,
      now.toISOString()
    )

    // Get transactions for this budget period
    let transactionQuery = supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('category', budget.category)
      .gte('posted_at', periodStart)
      .lt('posted_at', periodEnd)
      .eq('pending', false)
      .order('posted_at', { ascending: false })

    if (budget.subcategory) {
      transactionQuery = transactionQuery.eq('subcategory', budget.subcategory)
    }

    const { data: transactions, error: txError } = await transactionQuery

    if (txError) {
      console.error('Error fetching transactions:', txError)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    // Calculate totals
    const totalSpent = (transactions || []).reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0
    )
    const percentage = (totalSpent / budget.cap_amount) * 100
    const remaining = Math.max(0, budget.cap_amount - totalSpent)

    return NextResponse.json({
      budget,
      period_start: periodStart,
      period_end: periodEnd,
      cap_amount: budget.cap_amount,
      spent: totalSpent,
      remaining,
      percentage,
      is_exceeded: totalSpent > budget.cap_amount,
      transaction_count: transactions?.length || 0,
      transactions: transactions || []
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
