-- Simple Migration Script - Step by step approach
-- Run this in your Supabase SQL editor

-- Step 1: Check current data
SELECT 'Current restaurant_tables status values:' as info;
SELECT DISTINCT status FROM restaurant_tables;

SELECT 'Current orders status values:' as info;
SELECT DISTINCT status FROM orders;

-- Step 2: Update data to match new constraints BEFORE applying constraints
UPDATE restaurant_tables 
SET status = 'available' 
WHERE status NOT IN ('available', 'occupied', 'needs_reset');

UPDATE orders 
SET status = 'active' 
WHERE status NOT IN ('active', 'completed', 'cancelled');

-- Step 3: Verify data is now compliant
SELECT 'Updated restaurant_tables status values:' as info;
SELECT DISTINCT status FROM restaurant_tables;

SELECT 'Updated orders status values:' as info;
SELECT DISTINCT status FROM orders;

-- Step 4: Now safely update constraints
ALTER TABLE restaurant_tables DROP CONSTRAINT IF EXISTS restaurant_tables_status_check;
ALTER TABLE restaurant_tables ADD CONSTRAINT restaurant_tables_status_check 
    CHECK (status IN ('available', 'occupied', 'needs_reset'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('active', 'completed', 'cancelled'));

-- Step 5: Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'hi', 'kn')),
ADD COLUMN IF NOT EXISTS kitchen_station VARCHAR(100);

-- Step 6: Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  cuisine_type TEXT DEFAULT 'Indian',
  languages TEXT[] DEFAULT ARRAY['en'],
  subscription_plan TEXT DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Add missing columns to other tables
ALTER TABLE restaurant_tables 
ADD COLUMN IF NOT EXISTS waiter_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS qr_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS current_orders JSONB;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS waiter_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_joined_order BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES orders(id);

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS menu_item JSONB,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'prepared', 'delivered')),
ADD COLUMN IF NOT EXISTS kitchen_station VARCHAR(100),
ADD COLUMN IF NOT EXISTS special_notes TEXT,
ADD COLUMN IF NOT EXISTS customizations JSONB,
ADD COLUMN IF NOT EXISTS add_ons JSONB;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS message_hi TEXT,
ADD COLUMN IF NOT EXISTS message_kn TEXT,
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id),
ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES order_items(id);

-- Step 8: Add indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_restaurants_email ON restaurants(email);
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status ON restaurants(subscription_status);

-- Step 9: Enable RLS and create policies
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'restaurants' 
        AND policyname = 'Allow all operations on restaurants'
    ) THEN
        CREATE POLICY "Allow all operations on restaurants" ON restaurants FOR ALL USING (true);
    END IF;
END $$;

-- Step 10: Create trigger function and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_restaurants_updated_at'
    ) THEN
        CREATE TRIGGER update_restaurants_updated_at 
          BEFORE UPDATE ON restaurants 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Step 11: Insert sample restaurant data
INSERT INTO restaurants (name, address, city, state, phone, email) 
SELECT 'Sample Restaurant', '123 Main St', 'Sample City', 'Sample State', '+1234567890', 'info@samplerestaurant.com'
WHERE NOT EXISTS (SELECT 1 FROM restaurants LIMIT 1);

-- Step 12: Final verification
SELECT 'Migration completed successfully!' as status;
SELECT 'Final users table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position; 