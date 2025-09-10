import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/authMiddleware';
import { supabase } from '../../../../../lib/supabase';

// GET /api/admin/sessions/[sessionId] - Get detailed session information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Check authentication and authorization
    const authResult = await requireAuth(request, ['admin', 'owner']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const { sessionId } = await params;

    // Get session details with customers and orders
    const { data: session, error: sessionError } = await supabase
      .from('table_sessions')
      .select(`
        *,
        restaurant_tables (
          table_number,
          qr_code
        )
      `)
      .eq('id', sessionId)
      .eq('restaurant_id', user.restaurant_id)
      .is('deleted_at', null)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        message: 'Session not found',
        error: sessionError?.message
      }, { status: 404 });
    }

    // Get customers for this session
    const { data: customers, error: customersError } = await supabase
      .from('session_customers')
      .select('*')
      .eq('session_id', sessionId)
      .is('deleted_at', null)
      .order('joined_at', { ascending: true });

    if (customersError) {
      console.error('Error fetching customers:', customersError);
    }

    // Get orders for this session
    const { data: orders, error: ordersError } = await supabase
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
      .eq('session_id', sessionId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }

    // Transform customers data
    const transformedCustomers = customers?.map(customer => ({
      id: customer.id,
      session_id: customer.session_id,
      name: customer.name || 'Unknown Customer',
      phone: customer.phone || '',
      joined_at: new Date(customer.joined_at)
    })) || [];

    // Transform orders data
    const transformedOrders = orders?.map(order => {
      // Calculate total from order items to ensure accuracy (amounts are already in rupees)
      const calculatedTotal = order.order_items?.reduce((sum: any, item: any) => 
        sum + (item.price_at_time * item.quantity), 0) || 0;
      
      return {
        id: order.id,
        table: order.restaurant_tables?.table_number || 'Unknown',
        customer_name: order.users?.name || 'Unknown Customer',
        customer_phone: order.users?.phone || '',
        session_id: order.session_id,
        customer_id: order.customer_id,
        total: calculatedTotal, // Use calculated total instead of stored total
        status: order.status,
        timestamp: new Date(order.created_at),
        is_session_order: order.is_joined_order,
        items: order.order_items?.map((item: any) => ({
          id: item.id,
          order_id: item.order_id,
          menu_item: {
            id: item.menu_items?.id || '',
            name: item.menu_items?.name || 'Unknown Item',
            description: '',
            price: item.price_at_time,
            category_id: '',
            prepTime: 0,
            rating: 0,
            image: '',
            available: true,
            kitchen_stations: [],
            is_veg: false,
            cuisine_type: ''
          },
          quantity: item.quantity,
          status: item.status,
          kitchen_station: item.kitchen_station || '',
          price_at_time: item.price_at_time,
          selected_add_ons: []
        })) || []
      };
    }) || [];

    // Calculate session duration
    const now = new Date();
    const durationMs = now.getTime() - new Date(session.created_at).getTime();
    const durationMins = Math.floor(durationMs / 60000);
    const durationHours = Math.floor(durationMins / 60);
    const sessionDuration = durationHours > 0 
      ? `${durationHours}h ${durationMins % 60}m`
      : `${durationMins}m`;

    // Calculate average order value
    const totalOrderAmount = transformedOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = transformedOrders.length > 0 
      ? totalOrderAmount / transformedOrders.length
      : 0;

    // Debug logging
    console.log('Session Details Debug:', {
      sessionId,
      totalOrders: transformedOrders.length,
      orderTotals: transformedOrders.map(order => ({
        id: order.id,
        total: order.total,
        totalInRupees: (order.total / 100).toFixed(2)
      })),
      totalOrderAmount,
      totalOrderAmountInRupees: (totalOrderAmount / 100).toFixed(2),
      averageOrderValue,
      averageOrderValueInRupees: (averageOrderValue / 100).toFixed(2)
    });

    // Create participants list from unique customers who placed orders
    const uniqueOrderCustomers = new Set(transformedOrders.map(order => order.customer_id));
    const participantsFromOrders = Array.from(uniqueOrderCustomers).map(customerId => {
      const order = transformedOrders.find(o => o.customer_id === customerId);
      return {
        id: customerId,
        session_id: sessionId,
        name: order?.customer_name || 'Unknown Customer',
        phone: order?.customer_phone || '',
        joined_at: order?.timestamp || new Date()
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Session details retrieved successfully',
      data: {
        session: {
          ...session,
          created_at: new Date(session.created_at),
          updated_at: new Date(session.updated_at),
          otp_expires_at: session.otp_expires_at ? new Date(session.otp_expires_at) : null
        },
        customers: participantsFromOrders, // Use participants from orders
        orders: transformedOrders,
        totalCustomers: participantsFromOrders.length, // Count matches the list
        totalOrders: transformedOrders.length,
        averageOrderValue,
        sessionDuration
      }
    });

  } catch (error: any) {
    console.error('Get session details error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
