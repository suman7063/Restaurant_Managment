-- Safe Migration Script - Fixed version to handle existing data constraints
-- Run this in your Supabase SQL editor

-- First, let's check what columns exist in the users table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check current status values in restaurant_tables
SELECT DISTINCT status FROM restaurant_tables;

-- Check current status values in orders
SELECT DISTINCT status FROM orders;

-- Add missing columns to users table (safe - won't drop existing data)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'hi', 'kn')),
ADD COLUMN IF NOT EXISTS kitchen_station VARCHAR(100);

-- Make qr_code NOT NULL if it isn't already (this might fail if existing data has NULL values)
-- Let's check first
SELECT COUNT(*) as null_qr_codes FROM users WHERE qr_code IS NULL;

-- Only proceed if no NULL qr_codes exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE qr_code IS NULL) THEN
        ALTER TABLE users ALTER COLUMN qr_code SET NOT NULL;
        RAISE NOTICE 'Successfully made qr_code NOT NULL';
    ELSE
        RAISE NOTICE 'Cannot make qr_code NOT NULL - some users have NULL qr_codes. Please update them first.';
    END IF;
END $$;

-- Create restaurants table if it doesn't exist
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

-- Add missing columns to existing tables (if they don't exist)
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

-- Update table constraints safely by first updating data
DO $$
BEGIN
    -- Update restaurant_tables status values to match new constraint
    UPDATE restaurant_tables 
    SET status = 'available' 
    WHERE status NOT IN ('available', 'occupied', 'needs_reset');
    
    -- Update orders status values to match new constraint
    UPDATE orders 
    SET status = 'active' 
    WHERE status NOT IN ('active', 'completed', 'cancelled');
    
    RAISE NOTICE 'Updated existing status values to match new constraints';
END $$;

-- Now safely update constraints
DO $$
BEGIN
    -- Update restaurant_tables status constraint
    ALTER TABLE restaurant_tables DROP CONSTRAINT IF EXISTS restaurant_tables_status_check;
    ALTER TABLE restaurant_tables ADD CONSTRAINT restaurant_tables_status_check 
        CHECK (status IN ('available', 'occupied', 'needs_reset'));
    
    -- Update orders status constraint
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
    ALTER TABLE orders ADD CONSTRAINT orders_status_check 
        CHECK (status IN ('active', 'completed', 'cancelled'));
    
    RAISE NOTICE 'Successfully updated table constraints';
END $$;

-- Add indexes (safe - IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_restaurants_email ON restaurants(email);
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status ON restaurants(subscription_status);

-- Enable RLS on restaurants table if not already enabled
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for restaurants if it doesn't exist
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

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for new tables (safe - IF NOT EXISTS)
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

-- Insert sample restaurant data if none exists
INSERT INTO restaurants (name, address, city, state, phone, email) 
SELECT 'Sample Restaurant', '123 Main St', 'Sample City', 'Sample State', '+1234567890', 'info@samplerestaurant.com'
WHERE NOT EXISTS (SELECT 1 FROM restaurants LIMIT 1);

-- Verify the updated structure
SELECT 'Updated Users table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Show final status values
SELECT 'Final restaurant_tables status values:' as info;
SELECT DISTINCT status FROM restaurant_tables;

SELECT 'Final orders status values:' as info;
SELECT DISTINCT status FROM orders;

SELECT 'Migration completed successfully!' as status; 