import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/src/lib/supabase"
import { getUserIdFromRequest } from "@/src/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: budgets, error } = await supabaseAdmin
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('category', { ascending: true })
      .order('priority', { ascending: true })

    if (error) {
      console.error('Error fetching budgets:', error)
      return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
    }

    return NextResponse.json(budgets || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.category || !body.period || body.cap_amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: category, period, and cap_amount are required' },
        { status: 400 }
      )
    }

    const budgetData = {
      user_id: userId,
      category: body.category,
      subcategory: body.subcategory || null,
      label: body.label || null,
      period: body.period,
      cap_amount: body.cap_amount,
      currency: body.currency || 'USD',
      start_on: body.start_on || new Date().toISOString().split('T')[0],
      rollover: body.rollover ?? false,
      priority: body.priority ?? 100,
      is_active: body.is_active ?? true,
    }

    console.log('Creating budget:', budgetData)

    const { data: budget, error } = await supabaseAdmin
      .from('budgets')
      .insert(budgetData)
      .select()
      .single()

    if (error) {
      console.error('Error creating budget:', error)
      return NextResponse.json(
        { 
          error: 'Failed to create budget', 
          details: error.message,
          hint: error.hint,
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log('Budget created successfully:', budget.id)
    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

