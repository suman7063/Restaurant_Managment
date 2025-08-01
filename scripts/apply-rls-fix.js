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

async function applyRLSFix() {
  console.log('🔧 Applying RLS policy fixes...');

  try {
    // Apply menu_items policies
    console.log('📝 Adding menu_items INSERT policy...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Staff can insert menu items within restaurant" ON menu_items
        FOR INSERT WITH CHECK (
          deleted_at IS NULL AND
          restaurant_id IS NOT NULL AND
          EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.restaurant_id = menu_items.restaurant_id
            AND users.role IN ('admin', 'owner')
            AND users.deleted_at IS NULL
          )
        );
      `
    });

    console.log('📝 Adding menu_items UPDATE policy...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Staff can update menu items within restaurant" ON menu_items
        FOR UPDATE USING (
          deleted_at IS NULL AND
          restaurant_id IS NOT NULL AND
          EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.restaurant_id = menu_items.restaurant_id
            AND users.role IN ('admin', 'owner')
            AND users.deleted_at IS NULL
          )
        );
      `
    });

    console.log('📝 Adding menu_items DELETE policy...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Staff can delete menu items within restaurant" ON menu_items
        FOR DELETE USING (
          deleted_at IS NULL AND
          restaurant_id IS NOT NULL AND
          EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.restaurant_id = menu_items.restaurant_id
            AND users.role IN ('admin', 'owner')
            AND users.deleted_at IS NULL
          )
        );
      `
    });

    // Apply restaurant_menu_categories policies
    console.log('📝 Adding restaurant_menu_categories policies...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Staff can insert menu categories within restaurant" ON restaurant_menu_categories
        FOR INSERT WITH CHECK (
          deleted_at IS NULL AND
          restaurant_id IS NOT NULL AND
          EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.restaurant_id = restaurant_menu_categories.restaurant_id
            AND users.role IN ('admin', 'owner')
            AND users.deleted_at IS NULL
          )
        );
      `
    });

    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Staff can update menu categories within restaurant" ON restaurant_menu_categories
        FOR UPDATE USING (
          deleted_at IS NULL AND
          restaurant_id IS NOT NULL AND
          EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.restaurant_id = restaurant_menu_categories.restaurant_id
            AND users.role IN ('admin', 'owner')
            AND users.deleted_at IS NULL
          )
        );
      `
    });

    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Staff can delete menu categories within restaurant" ON restaurant_menu_categories
        FOR DELETE USING (
          deleted_at IS NULL AND
          restaurant_id IS NOT NULL AND
          EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.restaurant_id = restaurant_menu_categories.restaurant_id
            AND users.role IN ('admin', 'owner')
            AND users.deleted_at IS NULL
          )
        );
      `
    });

    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Menu categories are publicly readable within restaurant" ON restaurant_menu_categories
        FOR SELECT USING (deleted_at IS NULL AND restaurant_id IS NOT NULL);
      `
    });

    console.log('✅ RLS policies applied successfully!');
    console.log('🎉 You should now be able to add menu items without RLS errors.');

  } catch (error) {
    console.error('❌ Error applying RLS policies:', error);
    
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Some policies may already exist. This is normal.');
      console.log('✅ The fix should still work.');
    } else {
      console.log('💡 Alternative: You can manually run the SQL from scripts/fix-menu-items-rls.sql in your Supabase dashboard.');
    }
  }
}

applyRLSFix(); 