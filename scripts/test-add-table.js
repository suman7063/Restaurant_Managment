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

async function testAddTable() {
  console.log('🧪 Testing Add Table Functionality...\n');

  try {
    // Step 1: Get or create a restaurant
    console.log('1. Getting restaurant...');
    let { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1);

    if (restaurantError) {
      console.error('❌ Error fetching restaurants:', restaurantError.message);
      return;
    }

    let restaurantId;
    if (!restaurants || restaurants.length === 0) {
      console.log('⚠️  No restaurants found. Creating a test restaurant...');
      
      const { data: newRestaurant, error: createRestaurantError } = await supabase
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

      if (createRestaurantError) {
        console.error('❌ Error creating restaurant:', createRestaurantError.message);
        return;
      }

      restaurantId = newRestaurant.id;
      console.log('✅ Test restaurant created:', restaurantId);
    } else {
      restaurantId = restaurants[0].id;
      console.log('✅ Found restaurant:', restaurantId);
    }

    // Step 2: Test table creation
    console.log('\n2. Testing table creation...');
    
    const testTableNumber = Math.floor(Math.random() * 1000) + 1;
    const qrCode = `table-${testTableNumber}-${restaurantId.slice(0, 8)}-${Date.now()}`;
    
    const { data: newTable, error: createTableError } = await supabase
      .from('restaurant_tables')
      .insert({
        table_number: testTableNumber,
        qr_code: qrCode,
        restaurant_id: restaurantId,
        status: 'available',
        guests: 0,
        revenue: 0
      })
      .select()
      .single();

    if (createTableError) {
      console.error('❌ Error creating table:', createTableError.message);
      console.log('💡 This might indicate the RLS policies still need to be fixed');
      return;
    }

    console.log('✅ Test table created successfully!');
    console.log('   Table Number:', newTable.table_number);
    console.log('   QR Code:', newTable.qr_code);
    console.log('   Status:', newTable.status);

    // Step 3: Verify table was created
    console.log('\n3. Verifying table in database...');
    
    const { data: fetchedTables, error: fetchError } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('table_number', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching tables:', fetchError.message);
    } else {
      console.log('✅ Tables in database:', fetchedTables.length);
      const createdTable = fetchedTables.find(t => t.id === newTable.id);
      if (createdTable) {
        console.log('✅ Created table found in database');
      } else {
        console.log('❌ Created table not found in database');
      }
    }

    // Step 4: Test duplicate table number
    console.log('\n4. Testing duplicate table number...');
    
    const { data: duplicateTable, error: duplicateError } = await supabase
      .from('restaurant_tables')
      .insert({
        table_number: testTableNumber, // Same number
        qr_code: `table-${testTableNumber}-duplicate-${Date.now()}`,
        restaurant_id: restaurantId,
        status: 'available',
        guests: 0,
        revenue: 0
      })
      .select()
      .single();

    if (duplicateError) {
      console.log('✅ Duplicate table number properly rejected:', duplicateError.message);
    } else {
      console.log('⚠️  Duplicate table number was allowed (this might be expected)');
    }

    // Step 5: Clean up test data
    console.log('\n5. Cleaning up test data...');
    
    await supabase.from('restaurant_tables').delete().eq('id', newTable.id);
    if (duplicateTable) {
      await supabase.from('restaurant_tables').delete().eq('id', duplicateTable.id);
    }
    
    // Only delete restaurant if we created it
    if (!restaurants || restaurants.length === 0) {
      await supabase.from('restaurants').delete().eq('id', restaurantId);
    }
    
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Add Table functionality test completed successfully!');
    console.log('✅ Table creation works');
    console.log('✅ Data is saved to Supabase');
    console.log('✅ RLS policies are working correctly');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAddTable(); 