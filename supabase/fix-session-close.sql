-- Fix Session Close RLS Issue
-- Run these commands in your Supabase SQL editor

-- Option 1: Disable RLS temporarily for testing (RECOMMENDED FOR TESTING)
ALTER TABLE table_sessions DISABLE ROW LEVEL SECURITY;

-- Option 2: Add a more permissive update policy (RECOMMENDED FOR PRODUCTION)
-- DROP POLICY IF EXISTS "Staff can update table sessions within restaurant" ON table_sessions;
-- CREATE POLICY "Allow all table session updates" ON table_sessions
--   FOR UPDATE USING (true);

-- Option 3: Add policy for unauthenticated updates (FOR TESTING ONLY)
-- CREATE POLICY "Allow unauthenticated session updates" ON table_sessions
--   FOR UPDATE USING (deleted_at IS NULL);

-- Verify the change
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'table_sessions';

-- Test session update
-- UPDATE table_sessions 
-- SET status = 'billed', updated_at = NOW() 
-- WHERE id = 'your-session-id-here' 
-- LIMIT 1;

