import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { transformSupabaseTransactionToTransaction } from "@/lib/database-types"
import { getUserIdFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("accountId")
    const suspicious = searchParams.get("suspicious")

    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('posted_at', { ascending: false })

    // Apply filters
    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    if (suspicious === "true") {
      query = query.gt('fraud_score', 0.5)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // Ensure we always return an array
    const transactionsArray = Array.isArray(transactions) ? transactions : []
    const transformedTransactions = transactionsArray.map(transformSupabaseTransactionToTransaction)

    return NextResponse.json(transformedTransactions)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
