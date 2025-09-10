import { NextRequest, NextResponse } from 'next/server'
import { sessionService } from '../../../../lib/database'
import { z } from 'zod'

// Validation schema for session joining
const joinSessionSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
  tableId: z.string().uuid('Invalid table ID format'),
  customerName: z.string().min(1, 'Customer name is required').max(100, 'Customer name too long'),
  customerPhone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = joinSessionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',

      }, { status: 400 })
    }

    const { otp, tableId, customerName, customerPhone } = validationResult.data

    // Sanitize phone number (remove non-digits)
    const sanitizedPhone = customerPhone.replace(/\D/g, '')

    // Join session
    const result = await sessionService.joinSession(otp, tableId, {
      name: customerName.trim(),
      phone: sanitizedPhone
    })
    
    if (!result) {
      return NextResponse.json({
        success: false,
        message: 'Invalid OTP or session not found'
      }, { status: 422 })
    }

    const { session, customer } = result

    return NextResponse.json({
      success: true,
      message: 'Successfully joined session',
      data: {
        sessionId: session.id,
        tableId: session.table_id,
        restaurantId: session.restaurant_id,
        status: session.status,
        totalAmount: session.total_amount,
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          joinedAt: customer.joined_at
        }
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Session join error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
} 