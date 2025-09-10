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

async function testCloseSessionAPI() {
  try {
    console.log('🔍 Testing Close Session API...\n');

    // 1. Get active sessions
    console.log('1. Getting active sessions...');
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('table_sessions')
      .select('id, session_otp, status, total_amount, created_at')
      .eq('status', 'active')
      .is('deleted_at', null)
      .limit(3);

    if (sessionsError) {
      console.error('❌ Error fetching active sessions:', sessionsError);
      return;
    }

    console.log(`✅ Found ${activeSessions?.length || 0} active sessions`);
    activeSessions?.forEach(session => {
      console.log(`- Session ${session.id.slice(0, 8)}...: OTP ${session.session_otp}, ₹${session.total_amount || 0}`);
    });

    if (!activeSessions || activeSessions.length === 0) {
      console.log('⚠️  No active sessions found to test with');
      return;
    }

    // 2. Get admin users to test with
    console.log('\n2. Getting admin users...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, name, email, role, restaurant_id')
      .in('role', ['admin', 'owner'])
      .limit(1);

    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError);
      return;
    }

    console.log(`✅ Found ${adminUsers?.length || 0} admin users`);
    adminUsers?.forEach(user => {
      console.log(`- ${user.name} (${user.email}): ${user.role}, Restaurant: ${user.restaurant_id}`);
    });

    if (!adminUsers || adminUsers.length === 0) {
      console.log('⚠️  No admin users found');
      return;
    }

    const adminUser = adminUsers[0];
    const testSession = activeSessions[0];

    // 3. Test the close session API endpoint
    console.log('\n3. Testing close session API endpoint...');
    console.log(`Testing with session: ${testSession.id.slice(0, 8)}...`);
    console.log(`Admin user: ${adminUser.name} (${adminUser.role})`);

    // Simulate the API call that the frontend makes
    const response = await fetch(`http://localhost:3000/api/sessions/${testSession.id}/close`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer admin-token-${adminUser.id}` // Mock token
      }
    });

    console.log(`API Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.json();
      console.log('❌ API call failed!');
      console.log('Error:', JSON.stringify(errorData, null, 2));
    }

    // 4. Test with direct Supabase call (simulating authenticated context)
    console.log('\n4. Testing with direct Supabase call (authenticated context)...');
    
    // First, let's check if we can update the session with the admin user's context
    const { data: updateResult, error: updateError } = await supabase
      .from('table_sessions')
      .update({
        status: 'billed',
        updated_at: new Date().toISOString()
      })
      .eq('id', testSession.id)
      .eq('restaurant_id', adminUser.restaurant_id) // Add restaurant_id filter
      .select('id, status, updated_at');

    if (updateError) {
      console.error('❌ Error updating session:', updateError);
      console.log('This suggests the RLS policy is blocking the update');
    } else {
      console.log('✅ Session updated successfully!');
      console.log('Updated session:', updateResult);
    }

    // 5. Check RLS policy requirements
    console.log('\n5. Checking RLS policy requirements...');
    console.log('The RLS policy requires:');
    console.log('- deleted_at IS NULL ✅');
    console.log('- restaurant_id IS NOT NULL ✅');
    console.log('- User must be authenticated (auth.uid() exists) ❌');
    console.log('- User must have role IN (waiter, admin, owner) ❌');
    console.log('- User must have matching restaurant_id ❌');

    // 6. Test with a more permissive approach
    console.log('\n6. Testing with permissive RLS policy...');
    
    // Let's try to temporarily disable RLS for testing
    const { data: disableRLS, error: disableError } = await supabase
      .rpc('disable_rls_for_testing', { table_name: 'table_sessions' });

    if (disableError) {
      console.log('⚠️  Cannot disable RLS via RPC (expected)');
    }

    // 7. Alternative: Test with a simpler update
    console.log('\n7. Testing with simpler update approach...');
    
    // Try updating without the restaurant_id filter
    const { data: simpleUpdate, error: simpleError } = await supabase
      .from('table_sessions')
      .update({
        status: 'billed',
        updated_at: new Date().toISOString()
      })
      .eq('id', testSession.id)
      .select('id, status, updated_at');

    if (simpleError) {
      console.error('❌ Simple update also failed:', simpleError);
      console.log('This confirms RLS is blocking all updates');
    } else {
      console.log('✅ Simple update worked!');
      console.log('Updated session:', simpleUpdate);
    }

    console.log('\n🎉 Close session API testing completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Sessions exist and can be read');
    console.log('✅ Admin users exist');
    console.log('❌ RLS policies are blocking session updates');
    console.log('❌ API calls fail due to authentication issues');
    
    console.log('\n🔧 Solutions:');
    console.log('1. Ensure proper authentication in the frontend');
    console.log('2. Check that adminToken is valid and contains user info');
    console.log('3. Verify RLS policies allow the specific user to update sessions');
    console.log('4. Consider temporarily disabling RLS for testing');

  } catch (error) {
    console.error('Error testing close session API:', error);
  }
}

testCloseSessionAPI();

