import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { transformSupabaseAlertToFraudAlert, transformSupabaseTransactionToTransaction } from "@/lib/database-types"
import { getUserIdFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const severity = searchParams.get("severity")
    const status = searchParams.get("status")

    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabaseAdmin
      .from('alerts')
      .select(`
        *,
        transactions!alerts_tx_id_fkey(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (severity) {
      query = query.eq('severity', severity)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: alerts, error } = await query

    if (error) {
      console.error('Error fetching alerts:', error)
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    // Ensure we always return an array
    const alertsArray = Array.isArray(alerts) ? alerts : []
    const transformedAlerts = alertsArray.map(alert => {
      const transaction = alert.transactions ? transformSupabaseTransactionToTransaction(alert.transactions) : undefined
      return transformSupabaseAlertToFraudAlert(alert, transaction)
    })

    return NextResponse.json(transformedAlerts)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
