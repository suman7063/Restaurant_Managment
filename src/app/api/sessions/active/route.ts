import { NextRequest, NextResponse } from 'next/server'
import { sessionService } from '../../../../lib/database'
import { z } from 'zod'

// Validation schema for table ID
const tableIdSchema = z.string().uuid('Invalid table ID format')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tableId = searchParams.get('tableId')

    if (!tableId) {
      return NextResponse.json({
        success: false,
        message: 'Table ID is required'
      }, { status: 400 })
    }

    // Validate table ID
    const validationResult = tableIdSchema.safeParse(tableId)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid table ID format',

      }, { status: 400 })
    }

    const validatedTableId = validationResult.data

    // Get active session for table
    const session = await sessionService.getActiveSession(validatedTableId)
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'No active session found for this table'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Active session found',
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
    console.error('Get active session error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
} 