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

    // Get session orders
    const orders = await sessionService.getSessionOrders(validatedSessionId)
    
    if (!orders) {
      return NextResponse.json({
        success: false,
        message: 'Session not found or no orders'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Session orders retrieved successfully',
      data: {
        sessionId: validatedSessionId,
        orders: orders.map(order => ({
          id: order.id,
          table: order.table,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          items: order.items.map(item => ({
            id: item.id,
            menuItem: {
              id: item.menu_item.id,
              name: item.menu_item.name,
              price: item.menu_item.price
            },
            quantity: item.quantity,
            specialNotes: item.special_notes,
            status: item.status,
            priceAtTime: item.price_at_time
          })),
          total: order.total,
          timestamp: order.timestamp,
          estimatedTime: order.estimated_time,
          isJoinedOrder: order.is_joined_order
        })),
        totalOrders: orders.length,
        totalAmount: orders.reduce((sum, order) => sum + order.total, 0)
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Get session orders error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
} 