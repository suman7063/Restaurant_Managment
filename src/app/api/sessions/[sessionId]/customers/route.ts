import { NextRequest, NextResponse } from 'next/server'
import { sessionService } from '../../../../../lib/database'
import { z } from 'zod'

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
        message: 'Invalid session ID format',

      }, { status: 400 })
    }

    const validatedSessionId = validationResult.data

    // Get session customers
    const customers = await sessionService.getSessionCustomers(validatedSessionId)
    
    if (!customers) {
      return NextResponse.json({
        success: false,
        message: 'Session not found or no customers'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Session customers retrieved successfully',
      data: {
        sessionId: validatedSessionId,
        customers: customers.map(customer => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          joinedAt: customer.joined_at
        })),
        totalCustomers: customers.length
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Get session customers error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
} 