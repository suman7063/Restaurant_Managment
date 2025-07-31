import { NextRequest, NextResponse } from 'next/server'
import { authService, AuthUser } from './auth'

export interface AuthContext {
  user: AuthUser | null
  session: any
  isAuthenticated: boolean
}

// Session storage in cookies
const SESSION_COOKIE_NAME = 'auth_session'
const COOKIE_MAX_AGE = 8 * 60 * 60 // 8 hours in seconds

export class AuthMiddleware {
  // Get session token from request
  private getSessionToken(request: NextRequest): string | null {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)
    return sessionCookie?.value || null
  }

  // Set session cookie
  private setSessionCookie(response: NextResponse, sessionToken: string, maxAge?: number): void {
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAge || COOKIE_MAX_AGE,
      path: '/'
    })
  }

  // Clear session cookie
  private clearSessionCookie(response: NextResponse): void {
    response.cookies.delete(SESSION_COOKIE_NAME)
  }

  // Validate authentication for protected routes
  async validateAuth(request: NextRequest): Promise<{ response?: NextResponse; user?: AuthUser }> {
    const sessionToken = this.getSessionToken(request)
    
    if (!sessionToken) {
      return { response: this.redirectToLogin(request) }
    }

    try {
      const result = await authService.validateSession(sessionToken)
      
      if (!result) {
        const response = this.redirectToLogin(request)
        this.clearSessionCookie(response)
        return { response }
      }

      return { user: result.user }
    } catch (error) {
      console.error('Auth validation error:', error)
      const response = this.redirectToLogin(request)
      this.clearSessionCookie(response)
      return { response }
    }
  }

  // Check if user has required role
  hasRole(user: AuthUser, allowedRoles: string[]): boolean {
    return allowedRoles.includes(user.role)
  }

  // Check if user belongs to the required restaurant
  hasRestaurantAccess(user: AuthUser, restaurantId?: string): boolean {
    if (!restaurantId) return true
    return user.restaurant_id === restaurantId
  }

  // Redirect to login page
  private redirectToLogin(request: NextRequest): NextResponse {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to appropriate dashboard based on role
  redirectToDashboard(user: AuthUser): NextResponse {
    const dashboardUrl = authService.getDashboardUrl(user.role)
    return NextResponse.redirect(new URL(dashboardUrl, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  }

  // Create authenticated response with session cookie
  createAuthResponse(sessionToken: string, redirectUrl?: string, rememberMe?: boolean): NextResponse {
    const response = redirectUrl 
      ? NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
      : NextResponse.json({ success: true })
    
    const maxAge = rememberMe ? (30 * 24 * 60 * 60) : COOKIE_MAX_AGE // 30 days vs 8 hours
    this.setSessionCookie(response, sessionToken, maxAge)
    
    return response
  }

  // Create logout response
  createLogoutResponse(redirectUrl?: string): NextResponse {
    const response = redirectUrl 
      ? NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
      : NextResponse.json({ success: true })
    
    this.clearSessionCookie(response)
    return response
  }

  // Middleware for protecting admin routes
  async protectAdminRoute(request: NextRequest): Promise<NextResponse | undefined> {
    const { response, user } = await this.validateAuth(request)
    
    if (response) return response
    
    if (!user || !this.hasRole(user, ['admin', 'owner'])) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    return undefined
  }

  // Middleware for protecting owner routes
  async protectOwnerRoute(request: NextRequest): Promise<NextResponse | undefined> {
    const { response, user } = await this.validateAuth(request)
    
    if (response) return response
    
    if (!user || !this.hasRole(user, ['owner'])) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    return undefined
  }

  // Middleware for protecting waiter routes
  async protectWaiterRoute(request: NextRequest): Promise<NextResponse | undefined> {
    const { response, user } = await this.validateAuth(request)
    
    if (response) return response
    
    if (!user || !this.hasRole(user, ['waiter', 'admin', 'owner'])) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    return undefined
  }

  // Middleware for protecting kitchen routes
  async protectKitchenRoute(request: NextRequest): Promise<NextResponse | undefined> {
    const { response, user } = await this.validateAuth(request)
    
    if (response) return response
    
    if (!user || !this.hasRole(user, ['chef', 'admin', 'owner'])) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    return undefined
  }

  // Middleware for protecting staff routes (any authenticated staff)
  async protectStaffRoute(request: NextRequest): Promise<NextResponse | undefined> {
    const { response, user } = await this.validateAuth(request)
    
    if (response) return response
    
    if (!user || !this.hasRole(user, ['admin', 'owner', 'waiter', 'chef'])) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    return undefined
  }

  // Get current user from request (for API routes)
  async getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
    const sessionToken = this.getSessionToken(request)
    
    if (!sessionToken) return null

    try {
      const result = await authService.validateSession(sessionToken)
      return result?.user || null
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }
}

export const authMiddleware = new AuthMiddleware()

// Helper function for API routes to get current user
export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  return await authMiddleware.getCurrentUser(request)
}

// Helper function to require authentication in API routes
export async function requireAuth(request: NextRequest, allowedRoles?: string[]): Promise<{ user: AuthUser } | { error: NextResponse }> {
  const user = await getCurrentUser(request)
  
  if (!user) {
    return { error: new NextResponse('Unauthorized', { status: 401 }) }
  }

  if (allowedRoles && !authMiddleware.hasRole(user, allowedRoles)) {
    return { error: new NextResponse('Forbidden', { status: 403 }) }
  }

  return { user }
}

// CSRF Protection
export function generateCSRFToken(): string {
  return require('crypto').randomBytes(32).toString('hex')
}

export function validateCSRFToken(request: NextRequest, token: string): boolean {
  const headerToken = request.headers.get('X-CSRF-Token')
  const bodyToken = token
  
  if (!headerToken || !bodyToken) return false
  return headerToken === bodyToken
}

// Rate limiting for login attempts (simple in-memory implementation)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5

export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts?: number; resetTime?: number } {
  const now = Date.now()
  const attempts = loginAttempts.get(ip)

  if (!attempts || (now - attempts.lastAttempt) > RATE_LIMIT_WINDOW) {
    // Reset or first attempt
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 }
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    const resetTime = attempts.lastAttempt + RATE_LIMIT_WINDOW
    return { allowed: false, resetTime }
  }

  // Increment attempts
  loginAttempts.set(ip, { count: attempts.count + 1, lastAttempt: now })
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - attempts.count - 1 }
}