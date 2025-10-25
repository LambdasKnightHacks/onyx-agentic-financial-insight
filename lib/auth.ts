import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Method 1: Check for Authorization header (Bearer token)
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (!error && user) {
        return user.id
      }
    }

    // Method 2: Check for session cookie
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      // Extract session token from cookies
      const sessionMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/)
      if (sessionMatch) {
        const sessionToken = decodeURIComponent(sessionMatch[1])
        const { data: { user }, error } = await supabase.auth.getUser(sessionToken)
        if (!error && user) {
          return user.id
        }
      }
    }

    // Method 3: For development/testing - you can temporarily use a hardcoded user ID
    // Remove this in production!
    if (process.env.NODE_ENV === 'development') {
      // Use a valid UUID format for testing
      return '550e8400-e29b-41d4-a716-446655440000'
    }

    return null
  } catch (error) {
    console.error('Error getting user ID from request:', error)
    return null
  }
}

// Helper function to create a user if they don't exist
export async function ensureUserExists(email: string): Promise<string> {
  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return existingUser.id
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ email })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`)
    }

    return newUser.id
  } catch (error) {
    console.error('Error ensuring user exists:', error)
    throw error
  }
}
