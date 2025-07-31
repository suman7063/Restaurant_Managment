import { NextRequest, NextResponse } from 'next/server'
import { authService } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('auth_session')?.value

    if (sessionToken) {
      await authService.logout(sessionToken)
    }

    // Create response and clear session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.delete('auth_session')
    
    return response

  } catch (error: any) {
    console.error('Logout error:', error)
    
    // Even if logout fails, clear the session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.delete('auth_session')
    
    return response
  }
}