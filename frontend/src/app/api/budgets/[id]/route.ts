import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/src/lib/supabase"
import { getUserIdFromRequest } from "@/src/lib/auth-utils"

// manages single budget crud operations
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
    const { id: budgetId } = await params

    // Budget for user 
    const { data: existingBudget, error: fetchError } = await supabaseAdmin
      .from('budgets')
      .select('id')
      .eq('id', budgetId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existingBudget) {
      return NextResponse.json(
        { error: 'Budget not found or unauthorized' },
        { status: 404 }
      )
    }

    // Build update object with only provided fields
    const updateData: any = {}
    
    if (body.category !== undefined) updateData.category = body.category
    if (body.subcategory !== undefined) updateData.subcategory = body.subcategory
    if (body.label !== undefined) updateData.label = body.label
    if (body.period !== undefined) updateData.period = body.period
    if (body.cap_amount !== undefined) updateData.cap_amount = body.cap_amount
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.start_on !== undefined) updateData.start_on = body.start_on
    if (body.rollover !== undefined) updateData.rollover = body.rollover
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    updateData.updated_at = new Date().toISOString()

    const { data: budget, error } = await supabaseAdmin
      .from('budgets')
      .update(updateData)
      .eq('id', budgetId)
      .select()
      .single()

    if (error) {
      console.error('Error updating budget:', error)
      return NextResponse.json(
        { 
          error: 'Failed to update budget', 
          details: error.message 
        },
        { status: 500 }
      )
    }

    console.log('Budget updated successfully:', budgetId)
    return NextResponse.json(budget)
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

    const { id: budgetId } = await params

    // Budget for user
    const { data: existingBudget, error: fetchError } = await supabaseAdmin
      .from('budgets')
      .select('id')
      .eq('id', budgetId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existingBudget) {
      return NextResponse.json(
        { error: 'Budget not found or unauthorized' },
        { status: 404 }
      )
    }

    const { error } = await supabaseAdmin
      .from('budgets')
      .delete()
      .eq('id', budgetId)

    if (error) {
      console.error('Error deleting budget:', error)
      return NextResponse.json(
        { 
          error: 'Failed to delete budget', 
          details: error.message 
        },
        { status: 500 }
      )
    }

    console.log('Budget deleted successfully:', budgetId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

