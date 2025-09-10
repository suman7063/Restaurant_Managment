import { NextRequest, NextResponse } from 'next/server'
import { orderService } from '../../../lib/database'
import { z } from 'zod'

// Validation schema for order creation
const createOrderSchema = z.object({
  tableNumber: z.number().positive('Table number must be positive'),
  customerName: z.string().min(1, 'Customer name is required'),
  items: z.array(z.object({
    id: z.string().uuid('Invalid menu item ID'),
    name: z.string(),
    price: z.number().positive('Price must be positive'),
    quantity: z.number().positive('Quantity must be positive'),
    prepTime: z.number().nonnegative('Prep time must be non-negative'),
    kitchen_stations: z.array(z.string()).optional(),
    selected_add_ons: z.array(z.any()).optional()
  })).min(1, 'At least one item is required'),
  waiterId: z.string().uuid('Invalid waiter ID').nullable().optional(),
  sessionId: z.string().uuid('Invalid session ID').nullable().optional(),
  customerId: z.string().uuid('Invalid customer ID').nullable().optional(),
  restaurantId: z.string().uuid('Invalid restaurant ID').nullable().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = createOrderSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.error.errors);
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      }, { status: 400 })
    }

    const orderData = validationResult.data

    // Create order
    const order = await orderService.createOrder(orderData)
    
    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'Failed to create order. Session may not exist or be inactive.'
      }, { status: 409 })
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        tableNumber: order.table,
        customerName: order.customer_name,
        sessionId: order.session_id,
        customerId: order.customer_id,
        total: order.total,
        estimatedTime: order.estimated_time,
        isSessionOrder: order.is_session_order,
        items: order.items.map(item => ({
          id: item.id,
          menuItemName: item.menu_item.name,
          quantity: item.quantity,
          price: item.price_at_time,
          customerName: item.customer_name
        }))
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Order creation error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// GET /api/orders - Get all orders (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const customerId = searchParams.get('customerId')
    const tableId = searchParams.get('tableId')

    let orders: any[] = []

    if (sessionId && customerId) {
      // Get customer orders for a specific session
      orders = await orderService.getCustomerOrders(sessionId, customerId)
    } else if (sessionId) {
      // Get all orders for a session
      orders = await orderService.getSessionOrders(sessionId)
    } else if (tableId) {
      // Get all orders for a table
      orders = await orderService.getOrdersByTable(tableId)
    } else {
      // Get all orders (admin only)
      orders = await orderService.getAllOrders()
    }

    return NextResponse.json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders: orders.map(order => ({
          id: order.id,
          table: order.table,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          sessionId: order.session_id,
          customerId: order.customer_id,
          total: order.total,
          status: order.status,
          timestamp: order.timestamp,
          isSessionOrder: order.is_session_order,
          items: order.items.map((item: any) => ({
            id: item.id,
            menuItemName: item.menu_item.name,
            quantity: item.quantity,
            price: item.price_at_time,
            status: item.status,
            customerName: item.customer_name
          }))
        })),
        totalOrders: orders.length,
        totalAmount: orders.reduce((sum, order) => sum + order.total, 0)
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Get orders error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
} 