import { NextRequest, NextResponse } from 'next/server'
import { sessionService } from '../../../lib/database'
import { z } from 'zod'

// Validation schema for session creation
const createSessionSchema = z.object({
  tableId: z.string().uuid('Invalid table ID format'),
  restaurantId: z.string().uuid('Invalid restaurant ID format')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = createSessionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',

      }, { status: 400 })
    }

    const { tableId, restaurantId } = validationResult.data

    // Create session
    const session = await sessionService.createSession(tableId, restaurantId)
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Failed to create session. Table may not exist or be inactive.'
      }, { status: 409 })
    }

    return NextResponse.json({
      success: true,
      message: 'Session created successfully',
      data: {
        sessionId: session.id,
        tableId: session.table_id,
        restaurantId: session.restaurant_id,
        otp: session.session_otp,
        status: session.status,
        totalAmount: session.total_amount,
        createdAt: session.created_at,
        expiresAt: session.otp_expires_at
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Session creation error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// GET /api/sessions - Get all sessions (admin only)
export async function GET(request: NextRequest) {
  try {
    // This endpoint would typically require admin authentication
    // For now, return a simple response indicating this endpoint exists
    return NextResponse.json({
      success: false,
      message: 'Use specific session endpoints instead of listing all sessions'
    }, { status: 405 })
  } catch (error: any) {
    console.error('Session list error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
} 