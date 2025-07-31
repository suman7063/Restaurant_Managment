import { NextRequest, NextResponse } from 'next/server'
import { authService } from '../../../../lib/auth'
import { authMiddleware, checkRateLimit, validateCSRFToken } from '../../../../lib/authMiddleware'

export async function POST(request: NextRequest) {
  try {
    console.log('Login API called')
    
    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

    // Rate limiting disabled for now
    const rateLimit = { allowed: true, remainingAttempts: 999 }

    const body = await request.json()
    const { email, password, rememberMe = false, redirectUrl, csrfToken } = body
    console.log('Login attempt for:', email)

    // Validate CSRF token
    if (!validateCSRFToken(request, csrfToken)) {
      console.log('CSRF token validation failed')
      return NextResponse.json({ message: 'Invalid CSRF token' }, { status: 403 })
    }

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
    }

    // Attempt login
    console.log('Attempting authentication...')
    const result = await authService.login({ email, password }, rememberMe)
    const { user, session } = result
    console.log('Authentication successful for user:', user.email, 'role:', user.role)

    // Get dashboard URL based on role
    const dashboardUrl = authService.getDashboardUrl(user.role)
    console.log('Dashboard URL:', dashboardUrl)
    
    // Create response with session cookie (but no redirect)
    const responseData = {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language,
        restaurant_id: user.restaurant_id,
        restaurant_name: user.restaurant_name,
        kitchen_station_name: user.kitchen_station_name
      },
      redirectUrl: redirectUrl || dashboardUrl,
      remainingAttempts: rateLimit.remainingAttempts
    }
    
    console.log('Sending response:', responseData)
    
    const response = NextResponse.json(responseData)

    // Set session cookie
    const maxAge = rememberMe ? (30 * 24 * 60 * 60) : (8 * 60 * 60) // 30 days vs 8 hours
    response.cookies.set('auth_session', session.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/'
    })
    
    console.log('Session cookie set, returning response')
    return response

  } catch (error: any) {
    console.error('Login error:', error)
    
    // Return appropriate error message
    const status = error.message.includes('locked') ? 423 : 
                  error.message.includes('Invalid') ? 401 : 500
    
    return NextResponse.json(
      { message: error.message || 'Login failed' },
      { status }
    )
  }
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('auth_session')?.value

    if (sessionToken) {
      await authService.logout(sessionToken)
    }

    // Create logout response
    const response = authMiddleware.createLogoutResponse('/auth/login')
    
    return NextResponse.json({ success: true }, {
      status: 200,
      headers: response.headers
    })

  } catch (error: any) {
    console.error('Logout error:', error)
    
    // Even if logout fails, clear the session cookie
    const response = authMiddleware.createLogoutResponse('/auth/login')
    
    return NextResponse.json({ success: true }, {
      status: 200,
      headers: response.headers
    })
  }
}