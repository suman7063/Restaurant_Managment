const { createClient } = require('@supabase/supabase-js');

// Configuration - you'll need to update these with your actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jjotkjcpckrvpkwudtpw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Missing Supabase anon key');
  console.log('Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment');
  console.log('Or update the script with your actual anon key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSFix() {
  console.log('🔧 RLS Policy Fix for restaurant_tables\n');
  console.log('📋 Copy and paste this SQL into your Supabase SQL Editor:\n');
  console.log('='.repeat(70));
  
  const rlsFixSQL = `-- Fix RLS policies for restaurant_tables to allow INSERT operations

-- Add INSERT policy for restaurant_tables
CREATE POLICY "Staff can insert tables within restaurant" ON restaurant_tables
  FOR INSERT WITH CHECK (
    restaurant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.restaurant_id = restaurant_tables.restaurant_id
      AND users.role IN ('admin', 'owner')
    )
  );

-- Also add a more permissive policy for development/testing
CREATE POLICY "Allow table creation during development" ON restaurant_tables
  FOR INSERT WITH CHECK (
    auth.uid() IS NULL OR  -- Allow during development (no auth context)
    (
      restaurant_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.restaurant_id = restaurant_tables.restaurant_id
        AND users.role IN ('admin', 'owner')
      )
    )
  );

-- Add DELETE policy for restaurant_tables (for completeness)
CREATE POLICY "Staff can delete tables within restaurant" ON restaurant_tables
  FOR DELETE USING (
    restaurant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.restaurant_id = restaurant_tables.restaurant_id
      AND users.role IN ('admin', 'owner')
    )
  );`;

  console.log(rlsFixSQL);
  console.log('='.repeat(70));
  console.log('\n📝 Steps to apply the fix:');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Paste the SQL above');
  console.log('4. Click "Run"');
  console.log('5. Test table creation in your app\n');

  // Test current state
  console.log('🧪 Testing current table creation...');
  
  try {
    // Try to get a restaurant
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1);

    if (restaurantError) {
      console.error('❌ Error fetching restaurants:', restaurantError.message);
      return;
    }

    if (!restaurants || restaurants.length === 0) {
      console.log('⚠️  No restaurants found. You need to create a restaurant first.');
      return;
    }

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
      console.log('💡 This confirms the RLS policy issue exists');
      console.log('🔧 Please run the SQL fix above to resolve this issue');
      return;
    }

    console.log('✅ Test table created successfully:', newTable.id);
    console.log('🎉 RLS policies are working correctly!');
    
    // Clean up test data
    await supabase.from('restaurant_tables').delete().eq('id', newTable.id);
    console.log('🧹 Test data cleaned up');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the fix
applyRLSFix(); 