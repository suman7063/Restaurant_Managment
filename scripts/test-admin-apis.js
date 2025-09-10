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

async function testAdminAPIs() {
  try {
    console.log('Testing Admin APIs...\n');

    // Test 1: Check if we have admin users
    console.log('1. Checking admin users...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .limit(5);

    if (adminError) {
      console.error('Error fetching admin users:', adminError);
    } else {
      console.log('Admin users found:', adminUsers?.length || 0);
      if (adminUsers && adminUsers.length > 0) {
        console.log('Sample admin user:', {
          id: adminUsers[0].id,
          name: adminUsers[0].name,
          restaurant_id: adminUsers[0].restaurant_id
        });
      }
    }

    // Test 2: Check sessions
    console.log('\n2. Checking sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('table_sessions')
      .select('*')
      .limit(5);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
    } else {
      console.log('Sessions found:', sessions?.length || 0);
      if (sessions && sessions.length > 0) {
        console.log('Sample session:', {
          id: sessions[0].id,
          session_otp: sessions[0].session_otp,
          status: sessions[0].status,
          total_amount: sessions[0].total_amount
        });
      }
    }

    // Test 3: Check orders
    console.log('\n3. Checking orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    } else {
      console.log('Orders found:', orders?.length || 0);
      if (orders && orders.length > 0) {
        console.log('Sample order:', {
          id: orders[0].id,
          total: orders[0].total,
          status: orders[0].status,
          customer_id: orders[0].customer_id
        });
      }
    }

    // Test 4: Check order items
    console.log('\n4. Checking order items...');
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('*')
      .limit(5);

    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
    } else {
      console.log('Order items found:', orderItems?.length || 0);
      if (orderItems && orderItems.length > 0) {
        console.log('Sample order item:', {
          id: orderItems[0].id,
          quantity: orderItems[0].quantity,
          price_at_time: orderItems[0].price_at_time
        });
      }
    }

    console.log('\n✅ Admin API data verification completed!');
    console.log('The admin dashboard should now display real data from the database.');

  } catch (error) {
    console.error('Error testing admin APIs:', error);
  }
}

testAdminAPIs();

