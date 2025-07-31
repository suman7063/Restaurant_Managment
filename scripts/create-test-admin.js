require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jjotkjcpckrvpkwudtpw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Missing Supabase anon key');
  console.log('Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestAdmin() {
  console.log('🔧 Creating Test Admin User and Session...\n');

  try {
    // Step 1: Create a test restaurant
    console.log('1. Creating test restaurant...');
    
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        name: 'Test Restaurant',
        address: '123 Test Street',
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

    // Step 2: Create or get admin user
    console.log('\n2. Creating or getting admin user...');
    
    // First, try to get existing user
    let { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@test.com')
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Error getting admin user:', userError.message);
      return;
    }

    if (!adminUser) {
      // Create new user if doesn't exist
      const password = 'admin123';
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          name: 'Test Admin',
          email: 'admin@test.com',
          phone: '+1234567890',
          role: 'admin',
          restaurant_id: restaurant.id,
          language: 'en',
          password_hash: passwordHash,
          login_attempts: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating admin user:', createError.message);
        return;
      }
      
      adminUser = newUser;
      console.log('✅ New admin user created:', adminUser.id);
    } else {
      // Update existing user's restaurant_id to match the new restaurant
      const { error: updateError } = await supabase
        .from('users')
        .update({ restaurant_id: restaurant.id })
        .eq('id', adminUser.id);
      
      if (updateError) {
        console.error('❌ Error updating admin user:', updateError.message);
        return;
      }
      // Fetch the updated user
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', adminUser.id)
        .single();
      if (fetchError) {
        console.error('❌ Error fetching updated admin user:', fetchError.message);
        return;
      }
      adminUser = updatedUser;
      console.log('✅ Existing admin user updated with new restaurant:', adminUser.id);
      // Update all sessions for this user to use the new restaurant_id
      await supabase
        .from('auth_sessions')
        .update({ restaurant_id: restaurant.id })
        .eq('user_id', adminUser.id);
    }

    console.log('✅ Test admin user created:', adminUser.id);
    console.log('   Email: admin@test.com');
    console.log('   Password: admin123');

    // Step 3: Create or update session for the admin user
    console.log('\n3. Creating or updating session...');
    
    const sessionToken = 'test-session-123456789';
    const sessionId = '00000000-0000-0000-0000-123456789abc';
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
    
    // Delete any existing sessions for this user
    await supabase
      .from('auth_sessions')
      .delete()
      .eq('user_id', adminUser.id);

    // Create new session
    const { error: sessionError } = await supabase
      .from('auth_sessions')
      .insert({
        id: sessionId,
        user_id: adminUser.id,
        restaurant_id: restaurant.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      });

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError.message);
      return;
    }
    console.log('✅ New session created');
    console.log('   Session Token:', sessionToken);

    // Step 4: Test the session
    console.log('\n4. Testing session...');
    
    const testResponse = await fetch(`http://localhost:3002/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': `auth_session=${sessionToken}`
      }
    });

    if (testResponse.ok) {
      const userData = await testResponse.json();
      console.log('✅ Session test successful!');
      console.log('   User:', userData.user.name);
      console.log('   Role:', userData.user.role);
      console.log('   Restaurant ID:', userData.user.restaurant_id);
    } else {
      const errorText = await testResponse.text();
      console.log('❌ Session test failed:', testResponse.status, errorText);
    }

    // Step 5: Test table creation
    console.log('\n5. Testing table creation...');
    
    const tableData = {
      table_number: 1,
      qr_code: `table-1-${restaurant.id.slice(0, 8)}-${Date.now()}`,
      restaurant_id: restaurant.id,
      status: 'available',
      guests: 0,
      revenue: 0
    };

    const tableResponse = await fetch('http://localhost:3002/api/admin/tables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_session=${sessionToken}`
      },
      body: JSON.stringify(tableData)
    });

    if (tableResponse.ok) {
      const tableResult = await tableResponse.json();
      console.log('✅ Table creation test successful!');
      console.log('   Table created:', tableResult.table.table_number);
      
      // Clean up the test table
      await supabase.from('restaurant_tables').delete().eq('id', tableResult.table.id);
      console.log('   Test table cleaned up');
    } else {
      const errorText = await tableResponse.text();
      console.log('❌ Table creation test failed:', tableResponse.status, errorText);
    }

    console.log('\n🎉 Test setup completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   URL: http://localhost:3002/admin/dashboard');
    console.log('   Email: admin@test.com');
    console.log('   Password: admin123');
    console.log('\n🔑 Session Token (for testing):');
    console.log('   ' + sessionToken);
    console.log('\n💡 You can now test the Add Table functionality!');

  } catch (error) {
    console.error('❌ Setup failed with error:', error);
  }
}

// Run the setup
createTestAdmin(); 