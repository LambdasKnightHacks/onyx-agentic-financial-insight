import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { transformSupabaseAccountToAccount } from "@/lib/database-types"
import { getUserIdFromRequest } from "@/lib/auth"

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

    // Transform Supabase data to frontend format
    const transformedAccounts = accounts?.map(transformSupabaseAccountToAccount) || []

    return NextResponse.json(transformedAccounts)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
