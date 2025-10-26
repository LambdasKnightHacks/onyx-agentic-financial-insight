import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getUserIdFromRequest } from "@/lib/auth-utils"

// resolve and delete alert for a user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id: alertId } = await params

    // Update the alert
    const { data: alert, error } = await supabaseAdmin
      .from('alerts')
      .update({
        status: body.status || 'resolved',
        resolved: body.resolved ?? true
      })
      .eq('id', alertId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating alert:', error)
      return NextResponse.json(
        { error: 'Failed to update alert', details: error.message },
        { status: 500 }
      )
    }

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: alertId } = await params

    // Delete the alert
    const { error } = await supabaseAdmin
      .from('alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting alert:', error)
      return NextResponse.json(
        { error: 'Failed to delete alert', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Alert deleted' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

