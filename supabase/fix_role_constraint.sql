-- Fix role constraint to include 'owner' role
-- Run this in your Supabase SQL editor

-- First, drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Then add the new constraint with 'owner' role included
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('customer', 'admin', 'waiter', 'chef', 'owner'));

-- Verify the constraint was updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass AND conname = 'users_role_check'; 