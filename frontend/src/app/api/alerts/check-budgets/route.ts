import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getUserIdFromRequest } from "@/lib/auth-utils"

// Create admin client for server-side API route
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to calculate period dates
function calculatePeriodDates(
  startOn: string,
  period: string,
  transactionDate: string
): { periodStart: string; periodEnd: string } {
  const txDate = new Date(transactionDate)
  const startDate = new Date(startOn)
  
  let periodStart: Date
  let periodEnd: Date

  switch (period) {
    case 'day': {
      periodStart = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate())
      periodEnd = new Date(periodStart)
      periodEnd.setDate(periodEnd.getDate() + 1)
      break
    }
    
    case 'week': {
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
      const daysSinceStart = Math.floor((txDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceStart <= 30) {
        periodStart = new Date(startDate)
        periodStart.setHours(0, 0, 0, 0)
        periodEnd = new Date(txDate)
        periodEnd.setHours(23, 59, 59, 999)
      } else {
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
      const startMonth = startDate.getMonth()
      const startDay = startDate.getDate()
      const txMonth = txDate.getMonth()
      const txDay = txDate.getDate()
      
      if (txMonth > startMonth || (txMonth === startMonth && txDay >= startDay)) {
        periodStart = new Date(txDate.getFullYear(), startMonth, startDay)
      } else {
        periodStart = new Date(txDate.getFullYear() - 1, startMonth, startDay)
      }
      
      periodEnd = new Date(periodStart)
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      break
    }
    
    default:
      periodStart = new Date(txDate.getFullYear(), txDate.getMonth(), 1)
      periodEnd = new Date(txDate.getFullYear(), txDate.getMonth() + 1, 1)
  }

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString()
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Budget Alerts API] Checking for exceeded budgets for user:', userId)
    
    // Get all budgets for the user
    const { data: budgets, error: budgetError } = await supabaseAdmin
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
    
    if (budgetError) {
      console.error('[Budget Alerts API] Budget fetch error:', budgetError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch budgets',
        details: budgetError.message,
        alerts_created: 0
      }, { status: 500 })
    }
    
    console.log('[Budget Alerts API] Budget query result:', {
      count: budgets?.length || 0,
      user_id: userId,
      budgets: budgets?.map(b => ({ id: b.id, category: b.category, is_active: b.is_active })) || []
    })
    
    if (!budgets || budgets.length === 0) {
      console.log('[Budget Alerts API] No budgets found for user')
      return NextResponse.json({ 
        success: true, 
        alerts_created: 0,
        message: 'No budgets found'
      })
    }
    
    // Filter to active budgets
    const activeBudgets = budgets.filter(b => b.is_active === true || b.is_active === 1)
    console.log('[Budget Alerts API] Active budgets:', activeBudgets.length)
    
    if (activeBudgets.length === 0) {
      return NextResponse.json({ 
        success: true, 
        alerts_created: 0,
        message: 'No active budgets'
      })
    }
    
    const alertsCreated = []
    const now = new Date().toISOString()
    
    for (const budget of activeBudgets) {
      try {
        // Calculate period dates
        const { periodStart, periodEnd } = calculatePeriodDates(
          budget.start_on,
          budget.period,
          now
        )
        
        console.log('[Budget Alerts API] Checking budget:', budget.category, 'period:', periodStart, 'to', periodEnd)
        
        // Get transactions for this budget period
        let transactionQuery = supabaseAdmin
          .from('transactions')
          .select('amount, id')
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
        const isExceeded = totalSpent > budget.cap_amount
        
        console.log('[Budget Alerts API] Budget:', budget.category, 'Spent:', totalSpent, 'Cap:', budget.cap_amount, 'Exceeded:', isExceeded)
        
        if (isExceeded) {
          // Find the most recent transaction in this category to use as tx_id
          let txId = '00000000-0000-0000-0000-000000000000' // Default placeholder UUID
          
          // Query for the most recent transaction in this period to get its ID
          let recentTxQuery = supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('category', budget.category)
            .gte('posted_at', periodStart)
            .lt('posted_at', periodEnd)
            .eq('pending', false)
            .order('posted_at', { ascending: false })
            .limit(1)
          
          if (budget.subcategory) {
            recentTxQuery = recentTxQuery.eq('subcategory', budget.subcategory)
          }
          
          const { data: recentTx } = await recentTxQuery
          
          if (recentTx && recentTx.length > 0) {
            txId = recentTx[0].id
          }
          
          const alertData = {
            user_id: userId,
            tx_id: txId,
            type: 'budget',
            score: percentage / 100,
            reason: `${budget.category}: Spent ${totalSpent.toFixed(2)} of ${budget.cap_amount.toFixed(2)}`,
            severity: 'warn',
            status: 'active',
            resolved: false
          }
          
          console.log('[Budget Alerts API] Creating alert:', alertData)
          
          // Use upsert to handle race conditions - only insert if no active alert exists for this category
          const { data: existingInPeriod } = await supabaseAdmin
            .from('alerts')
            .select('id')
            .eq('user_id', userId)
            .eq('type', 'budget')
            .eq('status', 'active')
            .ilike('reason', `${budget.category}%`)
            .maybeSingle()
          
          if (existingInPeriod) {
            console.log('[Budget Alerts API] Alert already exists for', budget.category, '- skipping')
          } else {
            const { data: newAlert, error: alertError } = await supabaseAdmin
              .from('alerts')
              .insert(alertData)
              .select()
              .single()
            
            if (alertError) {
              // Check if error is due to duplicate (race condition)
              if (alertError.code === '23505' || alertError.message?.includes('duplicate') || alertError.message?.includes('unique')) {
                console.log('[Budget Alerts API] Alert already exists (race condition caught) for', budget.category)
              } else {
                console.error('[Budget Alerts API] Error creating alert:', alertError)
              }
            } else {
              console.log('[Budget Alerts API] Created budget alert for', budget.category)
              alertsCreated.push({ 
                category: budget.category, 
                alert_id: newAlert.id,
                percentage: percentage.toFixed(0)
              })
            }
          }
        }
      } catch (error) {
        console.error('[Budget Alerts API] Error processing budget:', budget.category, error)
      }
    }

    console.log('[Budget Alerts API] Created', alertsCreated.length, 'alerts')
    
    return NextResponse.json({ 
      success: true, 
      alerts_created: alertsCreated.length,
      alerts: alertsCreated
    })
  } catch (error) {
    console.error('[Budget Alerts API] Unexpected error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
