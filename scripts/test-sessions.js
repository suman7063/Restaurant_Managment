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

async function testSessions() {
  try {
    console.log('Testing Sessions Functionality...\n');

    // 1. Check if sessions table exists and has data
    console.log('1. Checking sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('table_sessions')
      .select('*')
      .limit(5);

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return;
    }

    console.log(`✅ Found ${sessions?.length || 0} sessions`);
    sessions?.forEach(session => {
      console.log(`- Session ${session.id.slice(0, 8)}...: ${session.status} (₹${session.total_amount || 0})`);
    });

    // 2. Check session customers
    console.log('\n2. Checking session customers...');
    const { data: sessionCustomers, error: customersError } = await supabase
      .from('session_customers')
      .select('*')
      .limit(5);

    if (customersError) {
      console.error('❌ Error fetching session customers:', customersError);
    } else {
      console.log(`✅ Found ${sessionCustomers?.length || 0} session customers`);
      sessionCustomers?.forEach(customer => {
        console.log(`- Customer: ${customer.name} (${customer.phone}) in session ${customer.session_id.slice(0, 8)}...`);
      });
    }

    // 3. Check orders with session data
    console.log('\n3. Checking orders with session data...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, session_id, status, total, created_at')
      .not('session_id', 'is', null)
      .limit(5);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
    } else {
      console.log(`✅ Found ${orders?.length || 0} orders with session data`);
      orders?.forEach(order => {
        console.log(`- Order ${order.id.slice(0, 8)}...: session ${order.session_id?.slice(0, 8)}..., status: ${order.status}, ₹${order.total}`);
      });
    }

    // 4. Check restaurant tables
    console.log('\n4. Checking restaurant tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('restaurant_tables')
      .select('id, table_number, qr_code, status')
      .limit(5);

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError);
    } else {
      console.log(`✅ Found ${tables?.length || 0} restaurant tables`);
      tables?.forEach(table => {
        console.log(`- Table ${table.table_number}: ${table.status}, QR: ${table.qr_code?.slice(0, 8)}...`);
      });
    }

    // 5. Test session creation (if we have a table)
    if (tables && tables.length > 0) {
      console.log('\n5. Testing session creation...');
      const testTable = tables[0];
      
      // Generate a test OTP
      const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date();
      otpExpiresAt.setHours(otpExpiresAt.getHours() + 24);

      // First check if restaurant exists
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id')
        .limit(1)
        .single();

      if (restaurantError) {
        console.log('⚠️  No restaurants found, creating test restaurant...');
        const { data: newRestaurant, error: createRestaurantError } = await supabase
          .from('restaurants')
          .insert({
            name: 'Test Restaurant',
            address: 'Test Address',
            phone: '1234567890',
            email: 'test@restaurant.com',
            cuisine_type: 'Indian',
            rating: 4.5,
            is_active: true
          })
          .select()
          .single();

        if (createRestaurantError) {
          console.error('❌ Error creating test restaurant:', createRestaurantError);
          return;
        }
        console.log('✅ Test restaurant created');
      }

      const restaurantId = restaurant?.id || '550e8400-e29b-41d4-a716-446655440000';

      const { data: newSession, error: createError } = await supabase
        .from('table_sessions')
        .insert({
          table_id: testTable.id,
          restaurant_id: restaurantId,
          session_otp: testOTP,
          otp_expires_at: otpExpiresAt.toISOString(),
          status: 'active',
          total_amount: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating test session:', createError);
      } else {
        console.log('✅ Test session created successfully!');
        console.log(`- Session ID: ${newSession.id.slice(0, 8)}...`);
        console.log(`- OTP: ${newSession.session_otp}`);
        console.log(`- Status: ${newSession.status}`);

        // Test session joining
        console.log('\n6. Testing session joining...');
        const { data: joinedCustomer, error: joinError } = await supabase
          .from('session_customers')
          .insert({
            session_id: newSession.id,
            name: 'Test Customer',
            phone: '1234567890'
          })
          .select()
          .single();

        if (joinError) {
          console.error('❌ Error joining session:', joinError);
        } else {
          console.log('✅ Customer joined session successfully!');
          console.log(`- Customer: ${joinedCustomer.name} (${joinedCustomer.phone})`);
          
          // Clean up test customer
          await supabase
            .from('session_customers')
            .delete()
            .eq('id', joinedCustomer.id);
          console.log('✅ Test customer cleaned up');
        }

        // Clean up test session
        await supabase
          .from('table_sessions')
          .delete()
          .eq('id', newSession.id);
        console.log('✅ Test session cleaned up');
      }
    }

    // 7. Check for any data inconsistencies
    console.log('\n7. Checking for data inconsistencies...');

    // Check for sessions without tables
    const { data: orphanedSessions, error: orphanError } = await supabase
      .from('table_sessions')
      .select('id, table_id')
      .is('deleted_at', null);

    if (!orphanError && orphanedSessions) {
      const orphanedCount = orphanedSessions.filter(s => !s.table_id).length;
      if (orphanedCount > 0) {
        console.log(`⚠️  Found ${orphanedCount} sessions without table_id`);
      } else {
        console.log('✅ All sessions have valid table_id');
      }
    }

    console.log('\n🎉 Sessions functionality testing completed!');
    console.log('\nSummary:');
    console.log(`- Sessions: ${sessions?.length || 0}`);
    console.log(`- Session Customers: ${sessionCustomers?.length || 0}`);
    console.log(`- Orders with Sessions: ${orders?.length || 0}`);
    console.log(`- Restaurant Tables: ${tables?.length || 0}`);

  } catch (error) {
    console.error('Error testing sessions:', error);
  }
}

testSessions();
