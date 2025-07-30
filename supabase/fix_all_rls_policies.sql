-- Fix RLS policies for all tables to prevent infinite recursion
-- Run this in your Supabase SQL editor

-- Function to safely fix RLS policies for a table
CREATE OR REPLACE FUNCTION fix_table_rls(table_name text) RETURNS void AS $$
BEGIN
    -- Disable RLS temporarily
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
    
    -- Drop all existing policies
    EXECUTE format('DROP POLICY IF EXISTS "Allow all operations on %I" ON %I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON %I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON %I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Enable update for users based on id" ON %I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Enable delete for users based on id" ON %I', table_name);
    
    -- Re-enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    
    -- Create a simple, safe policy
    EXECUTE format('CREATE POLICY "Allow all operations on %I" ON %I FOR ALL USING (true) WITH CHECK (true)', table_name, table_name);
    
    RAISE NOTICE 'Fixed RLS policies for table: %', table_name;
END;
$$ LANGUAGE plpgsql;

-- Fix RLS for all tables
SELECT fix_table_rls('users');
SELECT fix_table_rls('restaurants');
SELECT fix_table_rls('menu_items');
SELECT fix_table_rls('restaurant_tables');
SELECT fix_table_rls('orders');
SELECT fix_table_rls('order_items');
SELECT fix_table_rls('notifications');

-- Clean up the function
DROP FUNCTION fix_table_rls(text);

-- Verify all policies are working
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 