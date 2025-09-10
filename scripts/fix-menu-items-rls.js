const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMenuItemsRLS() {
  console.log('🔧 Fixing menu_items RLS policies...');

  try {
    // Drop existing policies first
    console.log('🗑️  Dropping existing menu_items policies...');
    await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Staff can insert menu items within restaurant" ON menu_items;`
    });
    await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Staff can update menu items within restaurant" ON menu_items;`
    });
    await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Staff can delete menu items within restaurant" ON menu_items;`
    });

    // Create new policies that allow admin client operations
    console.log('📝 Creating new menu_items INSERT policy...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Staff can insert menu items within restaurant" ON menu_items
        FOR INSERT WITH CHECK (
          deleted_at IS NULL AND
          restaurant_id IS NOT NULL AND (
            -- Allow admin client operations (when auth.uid() is NULL)
            auth.uid() IS NULL
            OR
            -- Allow authenticated users with proper role
            EXISTS (
              SELECT 1 FROM users 
              WHERE users.id = auth.uid() 
              AND users.restaurant_id = menu_items.restaurant_id
              AND users.role IN ('admin', 'owner')
              AND users.deleted_at IS NULL
            )
          )
        );
      `
    });

    console.log('📝 Creating new menu_items UPDATE policy...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Staff can update menu items within restaurant" ON menu_items
        FOR UPDATE USING (
          deleted_at IS NULL AND
          restaurant_id IS NOT NULL AND (
            -- Allow admin client operations (when auth.uid() is NULL)
            auth.uid() IS NULL
            OR
            -- Allow authenticated users with proper role
            EXISTS (
              SELECT 1 FROM users 
              WHERE users.id = auth.uid() 
              AND users.restaurant_id = menu_items.restaurant_id
              AND users.role IN ('admin', 'owner')
              AND users.deleted_at IS NULL
            )
          )
        );
      `
    });

    console.log('📝 Creating new menu_items DELETE policy...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Staff can delete menu items within restaurant" ON menu_items
        FOR DELETE USING (
          deleted_at IS NULL AND
          restaurant_id IS NOT NULL AND (
            -- Allow admin client operations (when auth.uid() is NULL)
            auth.uid() IS NULL
            OR
            -- Allow authenticated users with proper role
            EXISTS (
              SELECT 1 FROM users 
              WHERE users.id = auth.uid() 
              AND users.restaurant_id = menu_items.restaurant_id
              AND users.role IN ('admin', 'owner')
              AND users.deleted_at IS NULL
            )
          )
        );
      `
    });

    console.log('✅ Menu items RLS policies fixed successfully!');
    console.log('🎉 You should now be able to create menu items without RLS errors.');

  } catch (error) {
    console.error('❌ Error fixing menu_items RLS policies:', error);
    console.log('💡 You can manually run the SQL in your Supabase dashboard SQL editor.');
  }
}

fixMenuItemsRLS(); 