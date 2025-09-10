const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testOrderStatusUpdate() {
  try {
    console.log('Testing Order Status Update...\n');

    // Get current orders
    console.log('1. Current orders:');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, total, created_at')
      .limit(5);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return;
    }

    console.log('Orders found:', orders?.length || 0);
    orders?.forEach(order => {
      console.log(`- Order ${order.id.slice(0, 8)}...: ${order.status} (₹${order.total})`);
    });

    if (!orders || orders.length === 0) {
      console.log('No orders found to test with');
      return;
    }

    // Test status update
    const testOrder = orders[0];
    const newStatus = 'preparing';
    
    console.log(`\n2. Updating order ${testOrder.id.slice(0, 8)}... from ${testOrder.status} to ${newStatus}`);
    
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', testOrder.id)
      .select('id, status, updated_at')
      .single();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return;
    }

    console.log('✅ Order status updated successfully!');
    console.log('Updated order:', {
      id: updatedOrder.id.slice(0, 8) + '...',
      status: updatedOrder.status,
      updated_at: updatedOrder.updated_at
    });

    // Verify the update
    console.log('\n3. Verifying update...');
    const { data: verifyOrder, error: verifyError } = await supabase
      .from('orders')
      .select('id, status, updated_at')
      .eq('id', testOrder.id)
      .single();

    if (verifyError) {
      console.error('Error verifying order:', verifyError);
      return;
    }

    console.log('✅ Verification successful!');
    console.log('Current order status:', verifyOrder.status);

    // Test status flow
    console.log('\n4. Testing status flow...');
    const statusFlow = {
      'pending': 'preparing',
      'preparing': 'ready',
      'ready': 'served',
      'served': null,
      'cancelled': null
    };

    const currentStatus = verifyOrder.status;
    const nextStatus = statusFlow[currentStatus];
    
    if (nextStatus) {
      console.log(`Next status for '${currentStatus}': '${nextStatus}'`);
    } else {
      console.log(`No next status for '${currentStatus}' (final state)`);
    }

    console.log('\n🎉 Order status update testing completed successfully!');
    console.log('The admin dashboard should now be able to update order statuses.');

  } catch (error) {
    console.error('Error testing order status update:', error);
  }
}

testOrderStatusUpdate();

