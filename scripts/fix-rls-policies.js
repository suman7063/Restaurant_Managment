const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Please ensure you have:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS Policies for restaurant_tables...\n');

  try {
    // Read the SQL fix
    const sqlPath = path.join(__dirname, '../supabase/fix_rls_policies.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 SQL to be executed:');
    console.log('='.repeat(50));
    console.log(sqlContent);
    console.log('='.repeat(50));
    console.log('');

    // Execute the SQL using Supabase's rpc function
    // Note: This requires the user to have admin privileges
    console.log('⚠️  IMPORTANT: You need to run this SQL manually in your Supabase SQL Editor');
    console.log('📋 Copy the SQL above and paste it into your Supabase SQL Editor');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/sql');
    console.log('');

    // Alternative: Test if we can create a table now
    console.log('🧪 Testing table creation...');
    
    // First, let's try to get a restaurant ID
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1);

    if (restaurantError) {
      console.error('❌ Error fetching restaurants:', restaurantError.message);
      console.log('💡 Make sure you have at least one restaurant in your database');
      return;
    }

    if (!restaurants || restaurants.length === 0) {
      console.log('⚠️  No restaurants found. Creating a test restaurant first...');
      
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
        console.error('❌ Error creating test restaurant:', createRestaurantError.message);
        console.log('💡 You may need to run the RLS fix SQL first');
        return;
      }

      console.log('✅ Test restaurant created:', newRestaurant.id);
      
      // Now try to create a table
      const { data: newTable, error: createTableError } = await supabase
        .from('restaurant_tables')
        .insert({
          table_number: 1,
          qr_code: `table-1-${newRestaurant.id.slice(0, 8)}-${Date.now()}`,
          restaurant_id: newRestaurant.id,
          status: 'available',
          guests: 0,
          revenue: 0
        })
        .select()
        .single();

      if (createTableError) {
        console.error('❌ Error creating test table:', createTableError.message);
        console.log('💡 This confirms the RLS policy issue. Please run the SQL fix above.');
        return;
      }

      console.log('✅ Test table created successfully:', newTable.id);
      console.log('🎉 RLS policies are working correctly!');
      
      // Clean up test data
      await supabase.from('restaurant_tables').delete().eq('id', newTable.id);
      await supabase.from('restaurants').delete().eq('id', newRestaurant.id);
      console.log('🧹 Test data cleaned up');

    } else {
      const restaurantId = restaurants[0].id;
      console.log('✅ Found restaurant:', restaurantId);
      
      // Try to create a table
      const { data: newTable, error: createTableError } = await supabase
        .from('restaurant_tables')
        .insert({
          table_number: 1,
          qr_code: `table-1-${restaurantId.slice(0, 8)}-${Date.now()}`,
          restaurant_id: restaurantId,
          status: 'available',
          guests: 0,
          revenue: 0
        })
        .select()
        .single();

      if (createTableError) {
        console.error('❌ Error creating test table:', createTableError.message);
        console.log('💡 This confirms the RLS policy issue. Please run the SQL fix above.');
        return;
      }

      console.log('✅ Test table created successfully:', newTable.id);
      console.log('🎉 RLS policies are working correctly!');
      
      // Clean up test data
      await supabase.from('restaurant_tables').delete().eq('id', newTable.id);
      console.log('🧹 Test data cleaned up');
    }

  } catch (error) {
    console.error('❌ Error during RLS policy fix:', error);
  }
}

// Run the fix
fixRLSPolicies(); 