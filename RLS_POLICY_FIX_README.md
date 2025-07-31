# RLS Policy Fix for Table Creation

## Problem

You're encountering this error when trying to create a new table:

```
{
  "code": "42501",
  "details": null,
  "hint": null,
  "message": "new row violates row-level security policy for table \"restaurant_tables\""
}
```

## Root Cause

The Row Level Security (RLS) policies in your Supabase database are missing the INSERT policy for the `restaurant_tables` table. The current policies only allow SELECT and UPDATE operations, but not INSERT operations.

## Solution

### Option 1: Manual SQL Fix (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/sql

2. **Run the following SQL in the SQL Editor:**

```sql
-- Fix RLS policies for restaurant_tables to allow INSERT operations
-- This script adds the missing INSERT policy that was causing the "new row violates row-level security policy" error

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
-- This allows INSERT operations when auth.uid() is NULL (during development)
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
  );
```

3. **Click "Run" to execute the SQL**

### Option 2: Use the Helper Script

1. **Run the helper script:**
   ```bash
   node scripts/fix-rls-policies.js
   ```

2. **Follow the instructions** provided by the script

## What These Policies Do

### 1. **Staff can insert tables within restaurant**
- Allows admin and owner users to create tables within their restaurant
- Requires proper authentication and restaurant ownership

### 2. **Allow table creation during development**
- More permissive policy for development/testing
- Allows table creation when there's no authentication context
- Useful during initial setup and testing

### 3. **Staff can delete tables within restaurant**
- Allows admin and owner users to delete tables
- Provides complete CRUD operations for table management

## Verification

After applying the fix, you can verify it works by:

1. **Testing table creation** in your application
2. **Running the test script:**
   ```bash
   node scripts/test-table-operations.js
   ```

## Security Notes

- The development policy (`auth.uid() IS NULL`) should be removed in production
- In production, ensure proper authentication is in place
- Consider adding more restrictive policies based on your security requirements

## Troubleshooting

### If you still get RLS errors:

1. **Check your authentication:**
   - Ensure you're properly authenticated
   - Verify your user has the correct role (admin/owner)

2. **Check restaurant ownership:**
   - Ensure the restaurant_id exists
   - Verify your user belongs to that restaurant

3. **Check existing policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'restaurant_tables';
   ```

4. **Drop and recreate policies if needed:**
   ```sql
   DROP POLICY IF EXISTS "Staff can insert tables within restaurant" ON restaurant_tables;
   DROP POLICY IF EXISTS "Allow table creation during development" ON restaurant_tables;
   DROP POLICY IF EXISTS "Staff can delete tables within restaurant" ON restaurant_tables;
   ```
   Then run the fix SQL again.

## Files Created

- `supabase/fix_rls_policies.sql` - SQL fix for RLS policies
- `scripts/fix-rls-policies.js` - Helper script to apply the fix
- `RLS_POLICY_FIX_README.md` - This documentation

## Next Steps

After applying the fix:

1. ✅ **Test table creation** in your application
2. ✅ **Verify all CRUD operations** work correctly
3. ✅ **Test with different user roles** to ensure proper access control
4. ✅ **Remove development policies** before going to production 