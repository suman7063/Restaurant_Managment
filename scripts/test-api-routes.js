const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jjotkjcpckrvpkwudtpw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Missing Supabase anon key');
  console.log('Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAPIRoutes() {
  console.log('🧪 Testing API Routes...\n');

  try {
    // Step 1: Create a test restaurant and admin user
    console.log('1. Creating test restaurant and admin user...');
    
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        name: 'Test Restaurant API',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        phone: '+1234567890',
        email: 'test@restaurant.com',
        cuisine_type: 'Indian',
        languages: ['en'],
        subscription_plan: 'starter',
        subscription_status: 'active'
      })
      .select()
      .single();

    if (restaurantError) {
      console.error('❌ Error creating restaurant:', restaurantError.message);
      return;
    }

    console.log('✅ Test restaurant created:', restaurant.id);

    // Create admin user
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .insert({
        name: 'Test Admin',
        email: 'admin@test.com',
        phone: '+1234567890',
        role: 'admin',
        restaurant_id: restaurant.id,
        language: 'en',
        password_hash: '$2a$12$test.hash.for.testing.purposes.only'
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating admin user:', userError.message);
      return;
    }

    console.log('✅ Test admin user created:', adminUser.id);

    // Step 2: Create a session for the admin user
    console.log('\n2. Creating test session...');
    
    const sessionToken = 'test-session-token-' + Date.now();
    const { error: sessionError } = await supabase
      .from('auth_sessions')
      .insert({
        id: sessionToken,
        user_id: adminUser.id,
        restaurant_id: restaurant.id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      });

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError.message);
      return;
    }

    console.log('✅ Test session created');

    // Step 3: Test the API routes
    console.log('\n3. Testing API routes...');
    
    // Test GET /api/admin/tables
    console.log('   Testing GET /api/admin/tables...');
    const getResponse = await fetch(`http://localhost:3002/api/admin/tables?restaurantId=${restaurant.id}`, {
      method: 'GET',
      headers: {
        'Cookie': `auth_session=${sessionToken}`
      }
    });

    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('   ✅ GET /api/admin/tables successful');
      console.log('   Tables found:', getData.tables.length);
    } else {
      const errorData = await getResponse.text();
      console.log('   ❌ GET /api/admin/tables failed:', getResponse.status, errorData);
    }

    // Test POST /api/admin/tables
    console.log('   Testing POST /api/admin/tables...');
    const testTableData = {
      table_number: 999,
      qr_code: `table-999-${restaurant.id.slice(0, 8)}-${Date.now()}`,
      restaurant_id: restaurant.id,
      status: 'available',
      guests: 0,
      revenue: 0
    };

    const postResponse = await fetch('http://localhost:3002/api/admin/tables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_session=${sessionToken}`
      },
      body: JSON.stringify(testTableData)
    });

    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('   ✅ POST /api/admin/tables successful');
      console.log('   Table created:', postData.table.table_number);
    } else {
      const errorData = await postResponse.text();
      console.log('   ❌ POST /api/admin/tables failed:', postResponse.status, errorData);
    }

    // Step 4: Clean up test data
    console.log('\n4. Cleaning up test data...');
    
    // Delete the test table if it was created
    if (postResponse.ok) {
      const postData = await postResponse.json();
      await supabase.from('restaurant_tables').delete().eq('id', postData.table.id);
      console.log('   ✅ Test table deleted');
    }

    // Delete session
    await supabase.from('auth_sessions').delete().eq('id', sessionToken);
    console.log('   ✅ Test session deleted');

    // Delete admin user
    await supabase.from('users').delete().eq('id', adminUser.id);
    console.log('   ✅ Test admin user deleted');

    // Delete restaurant
    await supabase.from('restaurants').delete().eq('id', restaurant.id);
    console.log('   ✅ Test restaurant deleted');

    console.log('\n🎉 API routes test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAPIRoutes(); 