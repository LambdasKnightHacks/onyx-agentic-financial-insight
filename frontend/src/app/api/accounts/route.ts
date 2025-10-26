import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/src/lib/supabase"
import { transformSupabaseAccountToAccount } from "@/src/types/database-types"
import { getUserIdFromRequest } from "@/src/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: accounts, error } = await supabaseAdmin
      .from('ui_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching accounts:', error)
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
    }

    return NextResponse.json(accounts || [])
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
    const { name, institution, type, last4, balanceCurrent, balanceAvailable } = body

    if (!name || !institution || !type) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, institution, and type are required' 
      }, { status: 400 })
    }

    const { data: account, error: accountError } = await supabaseAdmin
      .from('accounts')
      .insert({
        user_id: userId,
        name,
        institution,
        type,
        display_mask: last4 || null,
        currency: 'USD',
      })
      .select()
      .single()

    if (accountError || !account) {
      console.error('Error creating account:', accountError)
      return NextResponse.json({ 
        error: 'Failed to create account', 
        details: accountError?.message
      }, { status: 500 })
    }

    const { error: balanceError } = await supabaseAdmin
      .from('account_balances')
      .insert({
        account_id: account.id,
        as_of: new Date().toISOString(),
        current: balanceCurrent || 0,
        available: balanceAvailable !== undefined ? balanceAvailable : balanceCurrent || 0,
        currency: 'USD',
        source: 'manual', 
      })

    if (balanceError) {
      console.error('Error creating account balance:', balanceError)
      // Rollback: delete the account we just created
      await supabaseAdmin.from('accounts').delete().eq('id', account.id)
      return NextResponse.json({ 
        error: 'Failed to create account balance', 
        details: balanceError.message
      }, { status: 500 })
    }

    const { data: fullAccount, error: viewError } = await supabaseAdmin
      .from('ui_accounts')
      .select('*')
      .eq('id', account.id)
      .single()

    if (viewError || !fullAccount) {
      console.error('Error fetching created account from view:', viewError)
      return NextResponse.json({
        id: account.id,
        institution: account.institution,
        nickname: account.name,
        last4: account.display_mask || '****',
        type: account.type,
        currency: 'USD',
        balanceCurrent: balanceCurrent || 0,
        balanceAvailable: balanceAvailable !== undefined ? balanceAvailable : balanceCurrent || 0,
        status: 'active',
      }, { status: 201 })
    }

    const transformedAccount = transformSupabaseAccountToAccount(fullAccount)

    return NextResponse.json(transformedAccount, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('id')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    const { error: balanceError } = await supabaseAdmin
      .from('account_balances')
      .delete()
      .eq('account_id', accountId)

    if (balanceError) {
      console.error('Error deleting account balances:', balanceError)
    }

    const { error: accountError } = await supabaseAdmin
      .from('accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', userId)

    if (accountError) {
      console.error('Error deleting account:', accountError)
      return NextResponse.json({ error: 'Failed to delete account', details: accountError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
