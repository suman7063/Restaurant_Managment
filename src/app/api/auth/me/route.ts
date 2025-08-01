import { NextRequest, NextResponse } from 'next/server'
import { authService } from '../../../../lib/auth'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('auth_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    // Validate session and get user
    const result = await authService.validateSession(sessionToken)

    if (!result) {
      return NextResponse.json({ message: 'Invalid or expired session' }, { status: 401 })
    }

    // Return user info (exclude sensitive data)
    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        restaurant_id: result.user.restaurant_id,
        restaurant_name: result.user.restaurant_name,
        kitchen_station_name: result.user.kitchen_station_name
      }
    })

  } catch (error: any) {
    console.error('Auth check error:', error)
    return NextResponse.json({ message: 'Authentication failed' }, { status: 401 })
  }
}