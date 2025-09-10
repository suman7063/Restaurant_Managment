import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/authMiddleware';
import { supabase } from '../../../../lib/supabase';

// GET /api/admin/orders - Get all orders (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const authResult = await requireAuth(request, ['admin', 'owner']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

    // Get real orders from database for today only
    const { data: orders, error } = await supabase
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
      .eq('restaurant_id', user.restaurant_id)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .is('deleted_at', null)
      .order('status', { ascending: false }) // Pending orders first
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch orders',
        error: error.message
      }, { status: 500 });
    }

    // Transform orders to match the expected format
    const transformedOrders = orders?.map(order => ({
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
    })) || [];

    const totalOrders = transformedOrders.length;
    const totalAmount = transformedOrders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = transformedOrders.filter(o => o.status === 'pending').length;

    return NextResponse.json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders: transformedOrders,
        totalOrders,
        totalAmount,
        pendingOrders
      }
    });

  } catch (error: any) {
    console.error('Get orders error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

