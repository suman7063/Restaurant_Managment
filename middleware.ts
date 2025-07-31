import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from './src/lib/authMiddleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/reset-password',
    '/auth/forgot-password',
    '/menu', // QR-based customer access
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/reset-password',
    '/api/auth/forgot-password',
    '/api/auth/me', // Authentication check endpoint
    // '/api/admin/create-test-user', // Temporary - remove in production
    '/api/admin/check-user', // Temporary for debugging
    '/demo',
    '/debug'
  ]

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Allow public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Protected route patterns with specific role requirements
  if (pathname.startsWith('/owner')) {
    return await authMiddleware.protectOwnerRoute(request)
  }

  if (pathname.startsWith('/admin')) {
    return await authMiddleware.protectAdminRoute(request)
  }

  if (pathname.startsWith('/waiter')) {
    return await authMiddleware.protectWaiterRoute(request)
  }

  if (pathname.startsWith('/kitchen')) {
    return await authMiddleware.protectKitchenRoute(request)
  }

  // Other staff routes (general staff access)
  if (pathname.startsWith('/staff')) {
    return await authMiddleware.protectStaffRoute(request)
  }

  // API routes protection
  if (pathname.startsWith('/api/admin')) {
    const result = await authMiddleware.validateAuth(request)
    if (result.response) return result.response
    
    if (!result.user || !authMiddleware.hasRole(result.user, ['admin', 'owner'])) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  if (pathname.startsWith('/api/owner')) {
    const result = await authMiddleware.validateAuth(request)
    if (result.response) return result.response
    
    if (!result.user || !authMiddleware.hasRole(result.user, ['owner'])) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  if (pathname.startsWith('/api/staff')) {
    const result = await authMiddleware.validateAuth(request)
    if (result.response) return result.response
    
    if (!result.user || !authMiddleware.hasRole(result.user, ['admin', 'owner', 'waiter', 'chef'])) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}