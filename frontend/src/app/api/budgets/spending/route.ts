import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/auth-utils"
import { getBudgetSpendingSummary } from "@/lib/budget-checker"

// returns the spending summary for all the budgets
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spendingSummary = await getBudgetSpendingSummary(userId)
    
    return NextResponse.json(spendingSummary)
  } catch (error) {
    console.error('Unexpected error fetching budget spending:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

