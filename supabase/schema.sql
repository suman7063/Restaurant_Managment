-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS auth_sessions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS restaurant_tables CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS restaurant_menu_categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS kitchen_stations CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS soft_delete_record() CASCADE;
DROP FUNCTION IF EXISTS restore_deleted_record() CASCADE;

-- Create soft delete functions
CREATE OR REPLACE FUNCTION soft_delete_record()
RETURNS TRIGGER AS $$
BEGIN
  -- Set deleted_at to current timestamp
  NEW.deleted_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION restore_deleted_record()
RETURNS TRIGGER AS $$
BEGIN
  -- Clear deleted_at to restore the record
  NEW.deleted_at = NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create tables for Restaurant Management System
CREATE TABLE restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  logo_image VARCHAR(255), -- Restaurant logo/branding image
  banner_image VARCHAR(255), -- Restaurant banner/hero image
  cuisine_type VARCHAR(100) DEFAULT 'Indian',
  subscription_plan VARCHAR(50) DEFAULT 'starter',
  subscription_status VARCHAR(50) DEFAULT 'active',
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kitchen stations table
CREATE TABLE kitchen_stations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cuisine_types TEXT[] DEFAULT '{}', -- Types of cuisine this station handles
  is_active BOOLEAN DEFAULT true,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (no table_number - users can visit multiple restaurants/tables)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'admin', 'waiter', 'chef', 'owner')),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  kitchen_station_id UUID REFERENCES kitchen_stations(id), -- Link to kitchen station
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  preferred_language VARCHAR(10) DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'kn')),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurant menu categories table
CREATE TABLE restaurant_menu_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu items table
CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL, -- Price in cents
  category_id UUID NOT NULL REFERENCES restaurant_menu_categories(id) ON DELETE CASCADE,
  description TEXT,
  prep_time INTEGER NOT NULL, -- Preparation time in minutes
  rating DECIMAL(3,2) DEFAULT 0,
  image VARCHAR(255),
  popular BOOLEAN DEFAULT FALSE,
  available BOOLEAN DEFAULT TRUE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  kitchen_station_id UUID REFERENCES kitchen_stations(id), -- Link to kitchen station
  is_veg BOOLEAN DEFAULT false,
  cuisine_type VARCHAR(100) DEFAULT 'Indian',
  customizations JSONB DEFAULT '[]',
  add_ons JSONB DEFAULT '[]',
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurant tables table
CREATE TABLE restaurant_tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL,
  qr_code VARCHAR(50) UNIQUE NOT NULL, -- QR code for table identification
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'reserved')),
  waiter_id UUID REFERENCES users(id),
  guests INTEGER DEFAULT 0,
  revenue INTEGER DEFAULT 0, -- Revenue in cents
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table with proper customer and table relationships
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES users(id), -- Link to customer user
  table_id UUID NOT NULL REFERENCES restaurant_tables(id), -- Link to specific table
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
  waiter_id UUID REFERENCES users(id),
  waiter_name VARCHAR(255),
  total INTEGER NOT NULL, -- Total in cents
  estimated_time INTEGER, -- Estimated completion time in minutes
  is_joined_order BOOLEAN DEFAULT false,
  parent_order_id UUID REFERENCES orders(id),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table (junction table for orders and menu items)
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_time INTEGER NOT NULL, -- Price when ordered (in cents)
  special_notes TEXT,
  status VARCHAR(50) DEFAULT 'order_received' CHECK (status IN ('order_received', 'preparing', 'prepared', 'delivered')),
  kitchen_station_id UUID REFERENCES kitchen_stations(id), -- Link to kitchen station
  preparation_start_time TIMESTAMP WITH TIME ZONE,
  preparation_end_time TIMESTAMP WITH TIME ZONE,
  delivery_time TIMESTAMP WITH TIME ZONE,
  selected_customization JSONB,
  selected_add_ons JSONB DEFAULT '[]',
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  user_id UUID REFERENCES users(id),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  item_id UUID REFERENCES order_items(id),
  read BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authentication sessions table
CREATE TABLE auth_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create soft delete triggers for all tables
CREATE TRIGGER soft_delete_restaurants
  BEFORE DELETE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_record();

CREATE TRIGGER soft_delete_kitchen_stations
  BEFORE DELETE ON kitchen_stations
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_record();

CREATE TRIGGER soft_delete_users
  BEFORE DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_record();

CREATE TRIGGER soft_delete_menu_items
  BEFORE DELETE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_record();

CREATE TRIGGER soft_delete_restaurant_tables
  BEFORE DELETE ON restaurant_tables
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_record();

CREATE TRIGGER soft_delete_restaurant_menu_categories
  BEFORE DELETE ON restaurant_menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_record();

CREATE TRIGGER soft_delete_orders
  BEFORE DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_record();

CREATE TRIGGER soft_delete_order_items
  BEFORE DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_record();

CREATE TRIGGER soft_delete_notifications
  BEFORE DELETE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_record();

CREATE TRIGGER soft_delete_auth_sessions
  BEFORE DELETE ON auth_sessions
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_record();

CREATE TRIGGER soft_delete_password_reset_tokens
  BEFORE DELETE ON password_reset_tokens
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_record();

-- Create indexes for better performance (including soft delete indexes)
CREATE INDEX idx_kitchen_stations_restaurant_id ON kitchen_stations(restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_kitchen_stations_active ON kitchen_stations(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_kitchen_stations_deleted_at ON kitchen_stations(deleted_at);

CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_restaurant_id ON users(restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_kitchen_station_id ON users(kitchen_station_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

CREATE INDEX idx_menu_items_category_id ON menu_items(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_menu_items_popular ON menu_items(popular) WHERE deleted_at IS NULL;
CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_menu_items_kitchen_station_id ON menu_items(kitchen_station_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_menu_items_deleted_at ON menu_items(deleted_at);

CREATE INDEX idx_restaurant_tables_qr_code ON restaurant_tables(qr_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_restaurant_tables_status ON restaurant_tables(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_restaurant_tables_restaurant_id ON restaurant_tables(restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_restaurant_tables_deleted_at ON restaurant_tables(deleted_at);

CREATE INDEX idx_restaurant_menu_categories_restaurant_id ON restaurant_menu_categories(restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_restaurant_menu_categories_active ON restaurant_menu_categories(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_restaurant_menu_categories_display_order ON restaurant_menu_categories(display_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_restaurant_menu_categories_deleted_at ON restaurant_menu_categories(deleted_at);

CREATE INDEX idx_orders_customer_id ON orders(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_table_id ON orders(table_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_status ON orders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_deleted_at ON orders(deleted_at);

CREATE INDEX idx_order_items_order_id ON order_items(order_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_order_items_kitchen_station_id ON order_items(kitchen_station_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_order_items_deleted_at ON order_items(deleted_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_read ON notifications(read) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_restaurant_id ON notifications(restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_deleted_at ON notifications(deleted_at);

-- Authentication indexes
CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_auth_sessions_restaurant_id ON auth_sessions(restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_auth_sessions_token ON auth_sessions(session_token) WHERE deleted_at IS NULL;
CREATE INDEX idx_auth_sessions_deleted_at ON auth_sessions(deleted_at);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_password_reset_tokens_restaurant_id ON password_reset_tokens(restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token) WHERE deleted_at IS NULL;
CREATE INDEX idx_password_reset_tokens_deleted_at ON password_reset_tokens(deleted_at);

-- Restaurant indexes
CREATE INDEX idx_restaurants_deleted_at ON restaurants(deleted_at);

-- Enable Row Level Security on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
-- RLS disabled for restaurant_tables - using API-level authorization instead
-- ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenant architecture (updated to exclude soft deleted records)

-- Restaurant policies - allow all operations for now during setup
CREATE POLICY "Restaurants are accessible during setup" ON restaurants
  FOR ALL USING (deleted_at IS NULL);

-- Kitchen stations policies - allow all operations for now during setup
CREATE POLICY "Kitchen stations are accessible during setup" ON kitchen_stations
  FOR ALL USING (deleted_at IS NULL);

-- Users policies - simplified to avoid recursion
-- Allow all user inserts (for onboarding and normal operations)
CREATE POLICY "Allow all user inserts" ON users
  FOR INSERT WITH CHECK (deleted_at IS NULL);

-- Allow users to read their own data or all during setup (no auth context)
CREATE POLICY "Users can read own data or all during setup" ON users
  FOR SELECT USING (
    deleted_at IS NULL AND (
      auth.uid() IS NULL OR  -- Allow during onboarding (no auth context)
      auth.uid() = id        -- Allow users to read their own data
    )
  );

-- Allow users to update with admin privileges
-- This allows users to update their own data AND admins/owners to update staff
CREATE POLICY "Users can update with admin privileges" ON users
  FOR UPDATE USING (
    deleted_at IS NULL AND (
      -- Allow if no auth context (service role operations)
      auth.uid() IS NULL
      OR
      -- Allow users to update their own data
      auth.uid() = id
      OR
      -- Allow admins/owners to update staff within same restaurant
      EXISTS (
        SELECT 1 FROM users as admin_user
        WHERE admin_user.id = auth.uid()
        AND admin_user.role IN ('admin', 'owner')
        AND admin_user.restaurant_id = users.restaurant_id
        AND admin_user.deleted_at IS NULL
      )
    )
  );

-- Menu items are readable within the restaurant context
CREATE POLICY "Menu items are publicly readable within restaurant" ON menu_items
  FOR SELECT USING (deleted_at IS NULL AND restaurant_id IS NOT NULL);

-- Staff can insert menu items within their restaurant
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

-- Staff can update menu items within their restaurant
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

-- Staff can delete menu items within their restaurant
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

-- Add RLS policies for restaurant_menu_categories table
-- Staff can insert menu categories within their restaurant
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

-- Staff can update menu categories within their restaurant
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

-- Staff can delete menu categories within their restaurant
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

-- Menu categories are readable within the restaurant context
CREATE POLICY "Menu categories are publicly readable within restaurant" ON restaurant_menu_categories
  FOR SELECT USING (deleted_at IS NULL AND restaurant_id IS NOT NULL);

-- RLS POLICIES DISABLED FOR restaurant_tables
-- Using API-level authorization instead of RLS due to custom auth system
--
-- Restaurant tables are readable within the restaurant context
-- CREATE POLICY "Restaurant tables are publicly readable within restaurant" ON restaurant_tables
--   FOR SELECT USING (deleted_at IS NULL AND restaurant_id IS NOT NULL);

-- Staff can insert tables within their restaurant
-- CREATE POLICY "Staff can insert tables within restaurant" ON restaurant_tables
--   FOR INSERT WITH CHECK (
--     deleted_at IS NULL AND
--     restaurant_id IS NOT NULL AND
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE users.id = auth.uid() 
--       AND users.restaurant_id = restaurant_tables.restaurant_id
--       AND users.role IN ('admin', 'owner')
--       AND users.deleted_at IS NULL
--     )
--   );

-- Staff can update tables within their restaurant (including soft delete/restore)
-- CREATE POLICY "Staff can update tables within restaurant" ON restaurant_tables
--   FOR UPDATE USING (
--     restaurant_id IS NOT NULL AND
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE users.id = auth.uid() 
--       AND users.restaurant_id = restaurant_tables.restaurant_id
--       AND users.role IN ('waiter', 'admin', 'owner')
--       AND users.deleted_at IS NULL
--     )
--   );

-- Staff can delete tables within their restaurant
-- CREATE POLICY "Staff can delete tables within restaurant" ON restaurant_tables
--   FOR DELETE USING (
--     deleted_at IS NULL AND
--     restaurant_id IS NOT NULL AND
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE users.id = auth.uid() 
--       AND users.restaurant_id = restaurant_tables.restaurant_id
--       AND users.role IN ('admin', 'owner')
--       AND users.deleted_at IS NULL
--     )
--   );

-- Allow table creation during development (for testing without auth context)
-- CREATE POLICY "Allow table creation during development" ON restaurant_tables
--   FOR INSERT WITH CHECK (deleted_at IS NULL AND restaurant_id IS NOT NULL);

-- Orders can be read by customers and staff within the restaurant
CREATE POLICY "Orders readable by customers and staff within restaurant" ON orders
  FOR SELECT USING (
    deleted_at IS NULL AND
    restaurant_id IS NOT NULL AND (
      customer_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.restaurant_id = orders.restaurant_id
        AND users.role IN ('waiter', 'admin', 'chef', 'owner')
        AND users.deleted_at IS NULL
      )
    )
  );

-- Order items follow same policy as orders
CREATE POLICY "Order items readable by customers and staff within restaurant" ON order_items
  FOR SELECT USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.deleted_at IS NULL
      AND (
        orders.customer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.restaurant_id = orders.restaurant_id
          AND users.role IN ('waiter', 'admin', 'chef', 'owner')
          AND users.deleted_at IS NULL
        )
      )
    )
  );

-- Notifications can be read by the user they belong to within the restaurant
CREATE POLICY "Users can read own notifications within restaurant" ON notifications
  FOR SELECT USING (deleted_at IS NULL AND user_id = auth.uid() AND restaurant_id IS NOT NULL);

-- Staff can insert orders within their restaurant
CREATE POLICY "Staff can insert orders within restaurant" ON orders
  FOR INSERT WITH CHECK (
    deleted_at IS NULL AND
    restaurant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.restaurant_id = orders.restaurant_id
      AND users.role IN ('waiter', 'admin', 'owner')
      AND users.deleted_at IS NULL
    )
  );

-- Staff can insert order items within their restaurant
CREATE POLICY "Staff can insert order items within restaurant" ON order_items
  FOR INSERT WITH CHECK (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM orders 
      JOIN users ON users.restaurant_id = orders.restaurant_id
      WHERE orders.id = order_items.order_id 
      AND orders.deleted_at IS NULL
      AND users.id = auth.uid()
      AND users.role IN ('waiter', 'admin', 'owner')
      AND users.deleted_at IS NULL
    )
  );

-- Staff can update orders within their restaurant
CREATE POLICY "Staff can update orders within restaurant" ON orders
  FOR UPDATE USING (
    deleted_at IS NULL AND
    restaurant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.restaurant_id = orders.restaurant_id
      AND users.role IN ('waiter', 'admin', 'chef', 'owner')
      AND users.deleted_at IS NULL
    )
  );

-- Authentication session policies - allow creation during login (when auth.uid() is NULL)
-- Drop any existing restrictive policies first
DROP POLICY IF EXISTS "Users can manage their own sessions" ON auth_sessions;
DROP POLICY IF EXISTS "Users can manage their own reset tokens" ON password_reset_tokens;

-- Create new policies that allow session creation during login
CREATE POLICY "Allow session creation and management" ON auth_sessions
  FOR INSERT WITH CHECK (deleted_at IS NULL);

CREATE POLICY "Users can read their own sessions" ON auth_sessions
  FOR SELECT USING (deleted_at IS NULL AND (user_id = auth.uid() OR auth.uid() IS NULL));

CREATE POLICY "Users can delete their own sessions" ON auth_sessions
  FOR DELETE USING (deleted_at IS NULL AND (user_id = auth.uid() OR auth.uid() IS NULL));

-- Password reset token policies - allow creation during reset (when auth.uid() is NULL)
CREATE POLICY "Allow password reset token creation" ON password_reset_tokens
  FOR INSERT WITH CHECK (deleted_at IS NULL);

CREATE POLICY "Users can read their own reset tokens" ON password_reset_tokens
  FOR SELECT USING (deleted_at IS NULL AND (user_id = auth.uid() OR auth.uid() IS NULL));

CREATE POLICY "Users can update their own reset tokens" ON password_reset_tokens
  FOR UPDATE USING (deleted_at IS NULL AND (user_id = auth.uid() OR auth.uid() IS NULL));

-- No sample data - tables will be populated through the application 