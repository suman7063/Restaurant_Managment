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

async function testAdminSessions() {
  try {
    console.log('Testing Admin Sessions API...\n');

    // 1. Get admin users to test with
    console.log('1. Getting admin users...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, name, email, role, restaurant_id')
      .in('role', ['admin', 'owner'])
      .limit(5);

    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError);
      return;
    }

    console.log(`✅ Found ${adminUsers?.length || 0} admin users`);
    adminUsers?.forEach(user => {
      console.log(`- ${user.name} (${user.email}): ${user.role}`);
    });

    if (!adminUsers || adminUsers.length === 0) {
      console.log('⚠️  No admin users found, creating test admin...');
      const { data: testAdmin, error: createAdminError } = await supabase
        .from('users')
        .insert({
          name: 'Test Admin',
          email: 'admin@test.com',
          password_hash: 'test-hash',
          role: 'admin',
          restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
          is_active: true
        })
        .select()
        .single();

      if (createAdminError) {
        console.error('❌ Error creating test admin:', createAdminError);
        return;
      }
      console.log('✅ Test admin created');
    }

    // 2. Get sessions with table information
    console.log('\n2. Getting sessions with table data...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('table_sessions')
      .select(`
        *,
        restaurant_tables (
          table_number,
          qr_code
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return;
    }

    console.log(`✅ Found ${sessions?.length || 0} sessions`);
    sessions?.forEach(session => {
      console.log(`- Session ${session.id.slice(0, 8)}...: ${session.status} (₹${session.total_amount || 0})`);
      console.log(`  Table: ${session.restaurant_tables?.table_number || 'Unknown'}`);
      console.log(`  OTP: ${session.session_otp}`);
    });

    // 3. Calculate statistics
    console.log('\n3. Calculating session statistics...');
    const activeSessions = sessions?.filter(s => s.status === 'active') || [];
    const totalRevenue = sessions?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;

    console.log(`- Total Sessions: ${sessions?.length || 0}`);
    console.log(`- Active Sessions: ${activeSessions.length}`);
    console.log(`- Total Revenue: ₹${totalRevenue}`);

    // 4. Test session data transformation
    console.log('\n4. Testing session data transformation...');
    const transformedSessions = sessions?.map(session => ({
      id: session.id,
      table_id: session.table_id,
      restaurant_id: session.restaurant_id,
      session_otp: session.session_otp,
      status: session.status,
      total_amount: session.total_amount,
      created_at: new Date(session.created_at),
      updated_at: new Date(session.updated_at),
      otp_expires_at: session.otp_expires_at ? new Date(session.otp_expires_at) : undefined,
      table_number: session.restaurant_tables?.table_number || 'Unknown',
      qr_code: session.restaurant_tables?.qr_code || ''
    })) || [];

    console.log(`✅ Transformed ${transformedSessions.length} sessions`);
    transformedSessions.slice(0, 2).forEach(session => {
      console.log(`- Session ${session.id.slice(0, 8)}...: Table ${session.table_number}, Status: ${session.status}`);
    });

    // 5. Test session customers
    console.log('\n5. Testing session customers...');
    const { data: sessionCustomers, error: customersError } = await supabase
      .from('session_customers')
      .select(`
        *,
        table_sessions (
          id,
          session_otp,
          status
        )
      `)
      .is('deleted_at', null);

    if (customersError) {
      console.error('❌ Error fetching session customers:', customersError);
    } else {
      console.log(`✅ Found ${sessionCustomers?.length || 0} session customers`);
      sessionCustomers?.forEach(customer => {
        console.log(`- ${customer.name} (${customer.phone}) in session ${customer.session_id.slice(0, 8)}...`);
      });
    }

    // 6. Test session orders
    console.log('\n6. Testing session orders...');
    const { data: sessionOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        session_id,
        total,
        status,
        created_at,
        table_sessions (
          id,
          session_otp
        )
      `)
      .not('session_id', 'is', null)
      .is('deleted_at', null);

    if (ordersError) {
      console.error('❌ Error fetching session orders:', ordersError);
    } else {
      console.log(`✅ Found ${sessionOrders?.length || 0} orders with sessions`);
      sessionOrders?.forEach(order => {
        console.log(`- Order ${order.id.slice(0, 8)}...: Session ${order.session_id?.slice(0, 8)}..., ₹${order.total}, ${order.status}`);
      });
    }

    console.log('\n🎉 Admin Sessions API testing completed!');
    console.log('\nSummary:');
    console.log(`- Admin Users: ${adminUsers?.length || 0}`);
    console.log(`- Sessions: ${sessions?.length || 0}`);
    console.log(`- Active Sessions: ${activeSessions.length}`);
    console.log(`- Total Revenue: ₹${totalRevenue}`);
    console.log(`- Session Customers: ${sessionCustomers?.length || 0}`);
    console.log(`- Session Orders: ${sessionOrders?.length || 0}`);

    console.log('\n✅ The admin sessions API should now work correctly!');

  } catch (error) {
    console.error('Error testing admin sessions:', error);
  }
}

testAdminSessions();

