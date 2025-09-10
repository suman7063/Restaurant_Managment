import { NextRequest, NextResponse } from 'next/server'
import { sessionService } from '../../../../lib/database'
import { z } from 'zod'
import { requireAuth } from '../../../../lib/authMiddleware'

// Validation schema for session ID
const sessionIdSchema = z.string().uuid('Invalid session ID format')

export async function GET(
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

    // Get session details
    const session = await sessionService.getSessionById(validatedSessionId)
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Session not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Session details retrieved successfully',
      data: {
        sessionId: session.id,
        tableId: session.table_id,
        restaurantId: session.restaurant_id,
        otp: session.session_otp,
        status: session.status,
        totalAmount: session.total_amount,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        expiresAt: session.otp_expires_at
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Get session details error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// DELETE /api/sessions/[sessionId] - Clear/delete session (admin/waiter only)
export async function DELETE(
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

    // Check authentication and authorization
    const authResult = await requireAuth(request, ['admin', 'waiter', 'owner'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { user } = authResult

    // Clear session
    const success = await sessionService.clearSession(validatedSessionId)
    
    if (!success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to clear session. Session may not exist or already be cleared.'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Session cleared successfully'
    }, { status: 200 })

  } catch (error: any) {
    console.error('Clear session error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
} 