import { NextRequest, NextResponse } from 'next/server'
import { orderService } from '../../../../lib/database'
import { z } from 'zod'

// Validation schema for order ID
const orderIdSchema = z.string().uuid('Invalid order ID format')

// Validation schema for order status update
const updateOrderStatusSchema = z.object({
  status: z.enum(['active', 'completed', 'cancelled']),
  itemId: z.string().uuid().optional(),
  itemStatus: z.enum(['order_received', 'preparing', 'prepared', 'delivered']).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    // Validate order ID from URL params
    const validationResult = orderIdSchema.safeParse(orderId)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid order ID format',
        errors: validationResult.error.errors
      }, { status: 400 })
    }

    const validatedOrderId = validationResult.data

    // Get order details
    const order = await orderService.getOrderById(validatedOrderId)
    
    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Order retrieved successfully',
      data: {
        order: {
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
            priceAtTime: item.price_at_time,
            kitchenStation: item.kitchen_station
          })),
          total: order.total,
          timestamp: order.timestamp,
          estimatedTime: order.estimated_time,
          status: order.status,
          isJoinedOrder: order.is_joined_order,
          sessionId: order.session_id,
          customerId: order.customer_id
        }
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Get order error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const body = await request.json()

    // Validate order ID from URL params
    const orderIdValidation = orderIdSchema.safeParse(orderId)
    if (!orderIdValidation.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid order ID format',
        errors: orderIdValidation.error.errors
      }, { status: 400 })
    }

    // Validate request body
    const bodyValidation = updateOrderStatusSchema.safeParse(body)
    if (!bodyValidation.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',
        errors: bodyValidation.error.errors
      }, { status: 400 })
    }

    const validatedOrderId = orderIdValidation.data
    const { status, itemId, itemStatus } = bodyValidation.data

    // Update order status
    if (status) {
      const success = await orderService.updateOrderStatus(validatedOrderId, status)
      if (!success) {
        return NextResponse.json({
          success: false,
          message: 'Failed to update order status'
        }, { status: 500 })
      }
    }

    // Update order item status if provided
    if (itemId && itemStatus) {
      const success = await orderService.updateOrderItemStatus(itemId, itemStatus)
      if (!success) {
        return NextResponse.json({
          success: false,
          message: 'Failed to update order item status'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully'
    }, { status: 200 })

  } catch (error: any) {
    console.error('Update order error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
} 