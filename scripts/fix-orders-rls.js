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

async function fixOrdersRLS() {
  try {
    console.log('Applying RLS policy fixes for customer order creation...');

    // Add policy for customers to insert their own orders
    const { error: customerOrdersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Customers can insert their own orders" ON orders
        FOR INSERT WITH CHECK (
          deleted_at IS NULL AND
          restaurant_id IS NOT NULL AND
          customer_id = auth.uid() AND
          EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.restaurant_id = orders.restaurant_id
            AND users.role = 'customer'
            AND users.deleted_at IS NULL
          )
        );
      `
    });

    if (customerOrdersError) {
      console.error('Error creating customer orders policy:', customerOrdersError);
    } else {
      console.log('✅ Customer orders policy created successfully');
    }

    // Add policy for customers to insert order items for their own orders
    const { error: customerOrderItemsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Customers can insert order items for their own orders" ON order_items
        FOR INSERT WITH CHECK (
          deleted_at IS NULL AND
          EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.deleted_at IS NULL
            AND orders.customer_id = auth.uid()
            AND EXISTS (
              SELECT 1 FROM users 
              WHERE users.id = auth.uid() 
              AND users.restaurant_id = orders.restaurant_id
              AND users.role = 'customer'
              AND users.deleted_at IS NULL
            )
          )
        );
      `
    });

    if (customerOrderItemsError) {
      console.error('Error creating customer order items policy:', customerOrderItemsError);
    } else {
      console.log('✅ Customer order items policy created successfully');
    }

    console.log('🎉 RLS policy fixes applied successfully!');
    console.log('Customers should now be able to place orders.');

  } catch (error) {
    console.error('Error applying RLS fixes:', error);
  }
}

fixOrdersRLS();
