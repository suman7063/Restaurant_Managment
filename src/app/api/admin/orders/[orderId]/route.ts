import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/authMiddleware';
import { supabase } from '../../../../../lib/supabase';

// PATCH /api/admin/orders/[orderId] - Update order status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Check authentication and authorization
    const authResult = await requireAuth(request, ['admin', 'owner']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const { orderId } = params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid status. Must be one of: pending, preparing, ready, served, cancelled'
      }, { status: 400 });
    }

    // Update order status
    const { data: order, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('restaurant_id', user.restaurant_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to update order status',
        error: error.message
      }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found or not authorized'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: order.id,
        status: order.status,
        updatedAt: order.updated_at
      }
    });

  } catch (error: any) {
    console.error('Update order status error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// GET /api/admin/orders/[orderId] - Get specific order details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Check authentication and authorization
    const authResult = await requireAuth(request, ['admin', 'owner']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const { orderId } = params;

    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (
            id,
            name,
            price
          )
        ),
        restaurant_tables (
          table_number
        ),
        users!orders_customer_id_fkey (
          name,
          phone
        )
      `)
      .eq('id', orderId)
      .eq('restaurant_id', user.restaurant_id)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch order',
        error: error.message
      }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 });
    }

    // Transform order to match expected format
    const transformedOrder = {
      id: order.id,
      table: order.restaurant_tables?.table_number || 'Unknown',
      customer_name: order.users?.name || 'Unknown Customer',
      customer_phone: order.users?.phone || '',
      session_id: order.session_id,
      customer_id: order.customer_id,
      total: order.total,
      status: order.status,
      timestamp: order.created_at,
      is_session_order: order.is_joined_order,
      items: order.order_items?.map(item => ({
        id: item.id,
        menu_item: {
          id: item.menu_items?.id || '',
          name: item.menu_items?.name || 'Unknown Item',
          price: item.price_at_time
        },
        quantity: item.quantity,
        price_at_time: item.price_at_time,
        status: item.status,
        customer_name: order.users?.name || 'Unknown Customer'
      })) || []
    };

    return NextResponse.json({
      success: true,
      message: 'Order retrieved successfully',
      data: {
        order: transformedOrder
      }
    });

  } catch (error: any) {
    console.error('Get order error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

