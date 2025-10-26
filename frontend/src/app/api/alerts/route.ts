import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getUserIdFromRequest } from "@/lib/auth-utils"

// fetch all alerts for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const severity = searchParams.get("severity")
    const status = searchParams.get("status")
    const type = searchParams.get("type")

    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabaseAdmin
      .from('alerts')
      .select(`
        *,
        transactions!alerts_tx_id_fkey(
          id,
          merchant_name,
          merchant,
          amount,
          posted_at,
          category
        )
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

    if (type) {
      query = query.eq('type', type)
    }

    const { data: alerts, error } = await query

    if (error) {
      console.error('Error fetching alerts:', error)
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    // Transform alerts to a unified format
    const alertsArray = Array.isArray(alerts) ? alerts : []
    const transformedAlerts = alertsArray.map(alert => {
      const transaction = alert.transactions
      
      return {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        status: alert.status,
        created_at: alert.created_at,
        reason: alert.reason,
        score: alert.score || 0,
        // Transaction data (if available)
        merchant: transaction?.merchant_name || transaction?.merchant,
        amount: transaction?.amount,
        date: transaction?.posted_at 
          ? new Date(transaction.posted_at).toLocaleDateString()
          : new Date(alert.created_at).toLocaleDateString(),
        // For backward compatibility with fraud alerts
        riskScore: alert.type === 'fraud' ? alert.score : undefined,
        reasonCodes: alert.reason && alert.type === 'fraud' 
          ? [alert.reason] 
          : [],
        evidenceTxnIds: alert.tx_id ? [alert.tx_id] : []
      }
    })

    return NextResponse.json(transformedAlerts)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

