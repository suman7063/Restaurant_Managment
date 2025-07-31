import { NextRequest, NextResponse } from 'next/server'
import { authService } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, restaurant_id } = body

    // Validate input
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 })
    }

    // Request password reset
    await authService.requestPasswordReset({ email, restaurant_id })

    // Always return success to prevent email enumeration
    return NextResponse.json({ 
      success: true, 
      message: 'If an account exists with that email, a password reset link has been sent.' 
    })

  } catch (error: any) {
    console.error('Forgot password error:', error)
    
    // Always return success to prevent email enumeration
    return NextResponse.json({ 
      success: true, 
      message: 'If an account exists with that email, a password reset link has been sent.' 
    })
  }
}