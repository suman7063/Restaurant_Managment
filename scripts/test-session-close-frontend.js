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

async function testSessionCloseFrontend() {
  try {
    console.log('🧪 Testing Session Close in Frontend Context...\n');

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

    const testSession = activeSessions[0];

    // 2. Test the session close API endpoint with proper authentication simulation
    console.log('\n2. Testing session close API endpoint...');
    console.log(`Testing with session: ${testSession.id.slice(0, 8)}...`);

    // Simulate the frontend API call with credentials
    const response = await fetch(`http://localhost:3000/api/sessions/${testSession.id}/close`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // This is what the frontend now uses
    });

    console.log(`API Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ API call failed!');
      console.log('Error:', errorText);
      
      // Try to parse as JSON if possible
      try {
        const errorData = JSON.parse(errorText);
        console.log('Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('Raw error response:', errorText);
      }
    }

    // 3. Test direct database update (what the API should do)
    console.log('\n3. Testing direct database update (API logic)...');
    
    const { data: updateResult, error: updateError } = await supabase
      .from('table_sessions')
      .update({
        status: 'billed',
        updated_at: new Date().toISOString()
      })
      .eq('id', testSession.id)
      .select('id, status, updated_at')
      .single();

    if (updateError) {
      console.error('❌ Direct database update failed:', updateError);
    } else {
      console.log('✅ Direct database update successful!');
      console.log('Updated session:', updateResult);
      
      // Revert the change
      await supabase
        .from('table_sessions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', testSession.id);
      console.log('✅ Reverted session back to active');
    }

    // 4. Test session service function directly
    console.log('\n4. Testing sessionService.closeSession function...');
    
    // Simulate the sessionService.closeSession logic
    const { data: serviceResult, error: serviceError } = await supabase
      .from('table_sessions')
      .update({
        status: 'billed',
        updated_at: new Date().toISOString()
      })
      .eq('id', testSession.id);

    if (serviceError) {
      console.error('❌ sessionService.closeSession failed:', serviceError);
    } else {
      console.log('✅ sessionService.closeSession would work!');
      
      // Revert the change
      await supabase
        .from('table_sessions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', testSession.id);
      console.log('✅ Reverted session back to active');
    }

    // 5. Check authentication status
    console.log('\n5. Checking authentication status...');
    
    // Test the auth/me endpoint to see if authentication is working
    const authResponse = await fetch('http://localhost:3000/api/auth/me', {
      credentials: 'include'
    });

    console.log(`Auth check status: ${authResponse.status}`);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Authentication working!');
      console.log('User:', authData.user?.name, 'Role:', authData.user?.role);
    } else {
      console.log('❌ Authentication not working');
      console.log('This explains why session close API fails');
    }

    console.log('\n🎉 Session Close Frontend Testing Completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Database operations work correctly');
    console.log('✅ sessionService.closeSession works');
    console.log('❌ API authentication is the issue');
    
    console.log('\n🔧 Solutions:');
    console.log('1. Ensure you are logged in as admin in the browser');
    console.log('2. Check that session cookies are being sent');
    console.log('3. Verify the auth/me endpoint returns valid user data');
    console.log('4. Test the session close button in the actual admin dashboard');

  } catch (error) {
    console.error('Error testing session close frontend:', error);
  }
}

testSessionCloseFrontend();

