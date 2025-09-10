import { NextRequest, NextResponse } from 'next/server'
import { sessionService } from '../../../../../lib/database'
import { z } from 'zod'
import { requireAuth } from '../../../../../lib/authMiddleware'

// Validation schema for session ID
const sessionIdSchema = z.string().uuid('Invalid session ID format')

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    // Validate session ID from URL params
    const validationResult = sessionIdSchema.safeParse(sessionId)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid session ID format'
      }, { status: 400 })
    }

    const validatedSessionId = validationResult.data

    console.log('🔍 Close session API called for session:', validatedSessionId);

    // Check authentication and authorization (admin/waiter only)
    const authResult = await requireAuth(request, ['admin', 'waiter', 'owner'])
    
    if ('error' in authResult) {
      console.log('❌ Authentication failed:', authResult.error.status);
      
      // Check if this is a development environment and allow bypass
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  DEVELOPMENT: Bypassing authentication for testing');
        
        // Close session without authentication
        const success = await sessionService.closeSession(validatedSessionId)
        
        if (!success) {
          return NextResponse.json({
            success: false,
            message: 'Failed to close session. Session may not exist or already be closed.'
          }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          message: 'Session closed successfully (development bypass)',
          data: {
            sessionId: validatedSessionId,
            closedBy: 'System (development)',
            closedAt: new Date().toISOString()
          }
        }, { status: 200 })
      }
      
      // In production, return the authentication error
      return authResult.error
    }

    const { user } = authResult
    console.log('✅ Authentication successful for user:', user.name, 'Role:', user.role);

    // Close session
    const success = await sessionService.closeSession(validatedSessionId)
    
    if (!success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to close session. Session may not exist or already be closed.'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Session closed successfully',
      data: {
        sessionId: validatedSessionId,
        closedBy: user.name,
        closedAt: new Date().toISOString()
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Close session error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
} 