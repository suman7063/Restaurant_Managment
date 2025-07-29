-- Quick fix for existing database - Add missing columns to users table
-- Run this in your Supabase SQL editor

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'hi', 'kn')),
ADD COLUMN IF NOT EXISTS kitchen_station VARCHAR(100);

-- Make qr_code NOT NULL if it isn't already
ALTER TABLE users ALTER COLUMN qr_code SET NOT NULL;

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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_restaurants_email ON restaurants(email);
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status ON restaurants(subscription_status);

-- Enable RLS on restaurants table
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for restaurants
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

-- Create trigger for restaurants table
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