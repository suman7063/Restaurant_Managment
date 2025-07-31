import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 })
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (userError || !user) {
      return NextResponse.json({
        found: false,
        message: 'User not found with that email address',
        error: userError?.message
      })
    }

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        has_password_hash: !!user.password_hash,
        password_hash_length: user.password_hash ? user.password_hash.length : 0,
        is_active: user.is_active,
        restaurant_id: user.restaurant_id,
        created_at: user.created_at
      }
    })

  } catch (error: any) {
    console.error('Check user error:', error)
    
    return NextResponse.json(
      { 
        message: error.message || 'Failed to check user',
        error: error.toString()
      },
      { status: 500 }
    )
  }
}