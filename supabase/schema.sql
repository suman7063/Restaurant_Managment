-- Create tables for Restaurant Management System

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  table_number INTEGER,
  role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'admin', 'waiter', 'chef')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu items table
CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL, -- Price in cents
  category VARCHAR(100) NOT NULL,
  prep_time INTEGER NOT NULL, -- Preparation time in minutes
  rating DECIMAL(3,2) DEFAULT 0,
  image VARCHAR(255),
  popular BOOLEAN DEFAULT FALSE,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tables table
CREATE TABLE restaurant_tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'reserved')),
  waiter_id UUID REFERENCES users(id),
  guests INTEGER DEFAULT 0,
  revenue INTEGER DEFAULT 0, -- Revenue in cents
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
  waiter_id UUID REFERENCES users(id),
  total INTEGER NOT NULL, -- Total in cents
  estimated_time INTEGER, -- Estimated completion time in minutes
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  user_id UUID REFERENCES users(id),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_qr_code ON users(qr_code);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_popular ON menu_items(popular);
CREATE INDEX idx_orders_table_number ON orders(table_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_restaurant_tables_status ON restaurant_tables(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own data and admins can read all
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Menu items are publicly readable
CREATE POLICY "Menu items are publicly readable" ON menu_items
  FOR SELECT USING (true);

-- Restaurant tables are publicly readable
CREATE POLICY "Restaurant tables are publicly readable" ON restaurant_tables
  FOR SELECT USING (true);

-- Orders can be read by customers at their table, waiters, and admins
CREATE POLICY "Orders readable by table customers and staff" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.table_number = orders.table_number 
      AND users.id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('waiter', 'admin', 'chef')
    )
  );

-- Order items follow same policy as orders
CREATE POLICY "Order items readable by table customers and staff" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      JOIN users ON users.table_number = orders.table_number
      WHERE orders.id = order_items.order_id 
      AND users.id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('waiter', 'admin', 'chef')
    )
  );

-- Notifications can be read by the user they belong to
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Insert policies for staff
CREATE POLICY "Staff can insert orders" ON orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('waiter', 'admin')
    )
  );

CREATE POLICY "Staff can insert order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('waiter', 'admin')
    )
  );

-- Update policies for staff
CREATE POLICY "Staff can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('waiter', 'admin', 'chef')
    )
  );

CREATE POLICY "Staff can update tables" ON restaurant_tables
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('waiter', 'admin')
    )
  );

-- Insert sample data
INSERT INTO menu_items (name, price, category, prep_time, rating, image, popular) VALUES
  ('Margherita Pizza', 599, 'Main', 15, 4.8, '🍕', true),
  ('Caesar Salad', 399, 'Starter', 5, 4.5, '🥗', false),
  ('Grilled Salmon', 899, 'Main', 20, 4.9, '🐟', true),
  ('Chocolate Cake', 299, 'Dessert', 3, 4.7, '🍰', false),
  ('Espresso Coffee', 199, 'Beverage', 2, 4.6, '☕', false),
  ('Mushroom Risotto', 799, 'Main', 18, 4.4, '🍚', false),
  ('Tiramisu', 399, 'Dessert', 3, 4.8, '🍮', true),
  ('Fresh Juice', 249, 'Beverage', 3, 4.3, '🧃', false);

-- Insert sample tables
INSERT INTO restaurant_tables (table_number, status, guests, revenue) VALUES
  (1, 'occupied', 4, 2275),
  (2, 'available', 0, 0),
  (3, 'occupied', 2, 1297),
  (4, 'cleaning', 0, 0),
  (5, 'occupied', 3, 1597),
  (6, 'available', 0, 0),
  (7, 'available', 0, 0),
  (8, 'occupied', 6, 4472);

-- Insert sample users
INSERT INTO users (qr_code, name, table_number, role) VALUES
  ('QR001', 'John Doe', 5, 'customer'),
  ('QR002', 'Jane Smith', 3, 'customer'),
  ('QR003', 'Bob Wilson', 7, 'customer'),
  ('ADMIN001', 'Mike Admin', NULL, 'admin'),
  ('WAITER001', 'Sarah Waiter', NULL, 'waiter'),
  ('CHEF001', 'Gordon Chef', NULL, 'chef'); 