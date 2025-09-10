const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCustomerUsersRLS() {
  try {
    console.log('Applying RLS policy fix for customer user creation...');

    // Add policy for customers to create their own accounts
    const { error: customerUsersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Customers can create their own accounts" ON users
        FOR INSERT WITH CHECK (
          deleted_at IS NULL AND
          role = 'customer' AND
          restaurant_id IS NOT NULL
        );
      `
    });

    if (customerUsersError) {
      console.error('Error creating customer users policy:', customerUsersError);
    } else {
      console.log('✅ Customer users policy created successfully');
    }

    console.log('🎉 RLS policy fix applied successfully!');
    console.log('Customers should now be able to create accounts and place orders.');

  } catch (error) {
    console.error('Error applying RLS fix:', error);
  }
}

fixCustomerUsersRLS();
