const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  console.log('💡 For testing without Supabase, the application will use mock data');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixTableSessionsRLS() {
  console.log('🔧 Fixing table_sessions RLS policies...');

  try {
    // Check if the policy already exists
    console.log('🔍 Checking existing policies...');
    const { data: existingPolicies, error: checkError } = await supabase
      .from('pg_policies')
      .select('policyname')
      .eq('tablename', 'table_sessions')
      .eq('policyname', 'Customers can create table sessions');

    if (checkError) {
      console.log('⚠️ Could not check existing policies, proceeding with policy creation...');
    }

    if (existingPolicies && existingPolicies.length > 0) {
      console.log('✅ Customer policy already exists, skipping...');
      return;
    }

    // Add policy for customers to create table sessions
    console.log('📝 Adding customer INSERT policy for table_sessions...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Customers can create table sessions" ON table_sessions
        FOR INSERT WITH CHECK (
          deleted_at IS NULL AND
          restaurant_id IS NOT NULL
        );
      `
    });

    if (error) {
      console.error('❌ Error adding customer policy:', error);
      throw error;
    }

    console.log('✅ Customer policy added successfully!');
    console.log('🎉 table_sessions RLS fix applied successfully!');
    
  } catch (error) {
    console.error('❌ Error applying RLS fix:', error);
    throw error;
  }
}

// Run the fix
fixTableSessionsRLS()
  .then(() => {
    console.log('✅ RLS fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ RLS fix failed:', error);
    process.exit(1);
  });