import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/src/lib/supabase"
import { getUserIdFromRequest } from "@/src/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clear all user data in the correct order (respecting foreign key constraints)
    const tables = ['alerts', 'insights', 'transactions', 'account_balances', 'accounts']
    
    for (const table of tables) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userId)

      if (error) {
        console.error(`Error clearing ${table}:`, error)
        return NextResponse.json({ 
          error: `Failed to clear ${table}`,
          details: error.message 
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All user data cleared successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
