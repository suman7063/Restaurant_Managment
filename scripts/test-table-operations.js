const { createClient } = require('@supabase/supabase-js');

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTableOperations() {
  console.log('🧪 Testing Table Operations...\n');

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1. Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('restaurants')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Supabase connection failed:', testError.message);
      console.log('💡 Make sure your Supabase credentials are configured in .env.local');
      return;
    }
    console.log('✅ Supabase connection successful\n');

    // Test 2: Create a test restaurant
    console.log('2. Creating test restaurant...');
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        name: 'Test Restaurant',
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
      console.log('❌ Failed to create restaurant:', restaurantError.message);
      return;
    }
    console.log('✅ Test restaurant created:', restaurant.id);

    // Test 3: Create a test table
    console.log('\n3. Creating test table...');
    const qrCode = `table-1-${restaurant.id.slice(0, 8)}-${Date.now()}`;
    const { data: table, error: tableError } = await supabase
      .from('restaurant_tables')
      .insert({
        table_number: 1,
        qr_code: qrCode,
        restaurant_id: restaurant.id,
        status: 'available',
        guests: 0,
        revenue: 0
      })
      .select()
      .single();

    if (tableError) {
      console.log('❌ Failed to create table:', tableError.message);
      return;
    }
    console.log('✅ Test table created:', table.id);

    // Test 4: Fetch tables
    console.log('\n4. Fetching tables...');
    const { data: tables, error: fetchError } = await supabase
      .from('restaurant_tables')
      .select(`
        *,
        waiter:users!restaurant_tables_waiter_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('restaurant_id', restaurant.id)
      .order('table_number', { ascending: true });

    if (fetchError) {
      console.log('❌ Failed to fetch tables:', fetchError.message);
      return;
    }
    console.log('✅ Tables fetched successfully:', tables.length, 'tables found');

    // Test 5: Update table
    console.log('\n5. Updating table...');
    const { data: updatedTable, error: updateError } = await supabase
      .from('restaurant_tables')
      .update({
        status: 'occupied',
        guests: 4,
        revenue: 5000 // 50.00 in cents
      })
      .eq('id', table.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Failed to update table:', updateError.message);
      return;
    }
    console.log('✅ Table updated successfully');

    // Test 6: Check table number uniqueness
    console.log('\n6. Testing table number uniqueness...');
    const { data: duplicateCheck, error: duplicateError } = await supabase
      .from('restaurant_tables')
      .select('id')
      .eq('table_number', 1)
      .eq('restaurant_id', restaurant.id);

    if (duplicateError) {
      console.log('❌ Failed to check table number:', duplicateError.message);
      return;
    }
    console.log('✅ Table number check successful:', duplicateCheck.length, 'tables with number 1');

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('restaurant_tables').delete().eq('restaurant_id', restaurant.id);
    await supabase.from('restaurants').delete().eq('id', restaurant.id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Table operations are working correctly.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testTableOperations(); 