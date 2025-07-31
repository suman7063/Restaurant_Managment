import { NextRequest, NextResponse } from 'next/server'
import { authService } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, new_password } = body

    // Validate input
    if (!token || !new_password) {
      return NextResponse.json({ message: 'Token and new password are required' }, { status: 400 })
    }

    if (new_password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    // Confirm password reset
    await authService.confirmPasswordReset({ token, new_password })

    return NextResponse.json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now log in with your new password.' 
    })

  } catch (error: any) {
    console.error('Reset password error:', error)
    
    return NextResponse.json(
      { message: error.message || 'Failed to reset password' },
      { status: 400 }
    )
  }
}