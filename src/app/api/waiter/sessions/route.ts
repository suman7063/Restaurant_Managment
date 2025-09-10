import { NextRequest, NextResponse } from 'next/server'
import { sessionService } from '../../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    // Get restaurant ID from query params (waiter's restaurant)
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        message: 'Restaurant ID is required'
      }, { status: 400 })
    }

    // Get all active sessions for the restaurant
    const sessions = await sessionService.getRestaurantSessions(restaurantId)
    
    if (!sessions) {
      return NextResponse.json({
        success: false,
        message: 'Failed to retrieve sessions'
      }, { status: 500 })
    }

    // For each session, get orders and customers
    const sessionsWithData = await Promise.all(
      sessions.map(async (session) => {
        const [orders, customers] = await Promise.all([
          sessionService.getSessionOrders(session.id),
          sessionService.getSessionCustomers(session.id)
        ]);

        return {
          session: {
            id: session.id,
            table_id: session.table_id,
            restaurant_id: session.restaurant_id,
            session_otp: session.session_otp,
            status: session.status,
            total_amount: session.total_amount,
            created_at: session.created_at,
            updated_at: session.updated_at
          },
          orders: orders || [],
          customers: customers || []
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Sessions retrieved successfully',
      data: {
        sessions: sessionsWithData,
        totalSessions: sessionsWithData.length,
        activeSessions: sessionsWithData.filter(s => s.session.status === 'active').length
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Get waiter sessions error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
} 