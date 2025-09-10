-- Migration: Add Session Management Tables for Group Ordering
-- This migration adds support for OTP-based group ordering sessions
-- Date: 2024-12-19
-- Description: Implements table_sessions and session_customers tables with orders table modifications

-- Add new columns to existing orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES table_sessions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS customer_session_id UUID REFERENCES session_customers(id) ON DELETE SET NULL;

-- Create table_sessions table for group ordering
CREATE TABLE IF NOT EXISTS table_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  session_otp VARCHAR(6) NOT NULL, -- 6-digit OTP for joining
  otp_expires_at TIMESTAMP WITH TIME ZONE, -- Optional OTP expiration
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'billed', 'cleared')),
  total_amount INTEGER DEFAULT 0, -- Total amount in cents
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session_customers table to track participants
CREATE TABLE IF NOT EXISTS session_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- Customer name
  phone VARCHAR(20) NOT NULL, -- Customer phone number
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create soft delete triggers for new tables
CREATE TRIGGER IF NOT EXISTS soft_delete_table_sessions
  BEFORE DELETE ON table_sessions
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_record();

CREATE TRIGGER IF NOT EXISTS soft_delete_session_customers
  BEFORE DELETE ON session_customers
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_record();

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_table_sessions_table_id_status ON table_sessions(table_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_table_sessions_session_otp ON table_sessions(session_otp) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_table_sessions_restaurant_id ON table_sessions(restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_table_sessions_deleted_at ON table_sessions(deleted_at);

CREATE INDEX IF NOT EXISTS idx_session_customers_session_id ON session_customers(session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_session_customers_deleted_at ON session_customers(deleted_at);

-- Add indexes for new order columns
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_customer_session_id ON orders(customer_session_id) WHERE deleted_at IS NULL;

-- Enable Row Level Security on new tables
ALTER TABLE table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for session management
-- Table sessions are readable within the restaurant context
CREATE POLICY IF NOT EXISTS "Table sessions are publicly readable within restaurant" ON table_sessions
  FOR SELECT USING (deleted_at IS NULL AND restaurant_id IS NOT NULL);

-- Staff can insert table sessions within their restaurant
CREATE POLICY IF NOT EXISTS "Staff can insert table sessions within restaurant" ON table_sessions
  FOR INSERT WITH CHECK (
    deleted_at IS NULL AND
    restaurant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.restaurant_id = table_sessions.restaurant_id
      AND users.role IN ('waiter', 'admin', 'owner')
      AND users.deleted_at IS NULL
    )
  );

-- Staff can update table sessions within their restaurant
CREATE POLICY IF NOT EXISTS "Staff can update table sessions within restaurant" ON table_sessions
  FOR UPDATE USING (
    deleted_at IS NULL AND
    restaurant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.restaurant_id = table_sessions.restaurant_id
      AND users.role IN ('waiter', 'admin', 'owner')
      AND users.deleted_at IS NULL
    )
  );

-- Session customers are readable within the session context
CREATE POLICY IF NOT EXISTS "Session customers are readable within session" ON session_customers
  FOR SELECT USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM table_sessions 
      WHERE table_sessions.id = session_customers.session_id
      AND table_sessions.deleted_at IS NULL
    )
  );

-- Anyone can insert session customers (for joining sessions)
CREATE POLICY IF NOT EXISTS "Anyone can insert session customers" ON session_customers
  FOR INSERT WITH CHECK (deleted_at IS NULL);

-- Staff can update session customers within their restaurant
CREATE POLICY IF NOT EXISTS "Staff can update session customers within restaurant" ON session_customers
  FOR UPDATE USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM table_sessions 
      JOIN users ON users.restaurant_id = table_sessions.restaurant_id
      WHERE table_sessions.id = session_customers.session_id
      AND table_sessions.deleted_at IS NULL
      AND users.id = auth.uid()
      AND users.role IN ('waiter', 'admin', 'owner')
      AND users.deleted_at IS NULL
    )
  );

-- Add comments for documentation
COMMENT ON TABLE table_sessions IS 'Manages group ordering sessions with OTP-based access';
COMMENT ON COLUMN table_sessions.session_otp IS '6-digit OTP for customers to join the session';
COMMENT ON COLUMN table_sessions.status IS 'Session status: active, billed, or cleared';
COMMENT ON COLUMN table_sessions.total_amount IS 'Total session amount in cents';

COMMENT ON TABLE session_customers IS 'Tracks participants in group ordering sessions';
COMMENT ON COLUMN session_customers.name IS 'Customer name for the session';
COMMENT ON COLUMN session_customers.phone IS 'Customer phone number for identification';

COMMENT ON COLUMN orders.session_id IS 'Link to group ordering session (nullable for individual orders)';
COMMENT ON COLUMN orders.customer_session_id IS 'Link to session customer (nullable for individual orders)';

-- Migration completed successfully 