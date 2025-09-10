import { NextRequest, NextResponse } from 'next/server'
import { sessionService } from '../../../../../lib/database'
import { z } from 'zod'
import { requireAuth } from '../../../../../lib/authMiddleware'

// Validation schema for session ID
const sessionIdSchema = z.string().uuid('Invalid session ID format')

export async function POST(
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
        message: 'Invalid session ID format',

      }, { status: 400 })
    }

    const validatedSessionId = validationResult.data

    // Check authentication and authorization (admin/waiter only)
    const authResult = await requireAuth(request, ['admin', 'waiter', 'owner'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { user } = authResult

    // Regenerate OTP
    const newOtp = await sessionService.regenerateOTP(validatedSessionId)
    
    if (!newOtp) {
      return NextResponse.json({
        success: false,
        message: 'Failed to regenerate OTP. Session may not exist or be inactive.'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'OTP regenerated successfully',
      data: {
        sessionId: validatedSessionId,
        newOtp,
        regeneratedBy: user.name,
        regeneratedAt: new Date().toISOString()
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Regenerate OTP error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
} 