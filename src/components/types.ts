// Type definitions for Restaurant Management System
export interface User {
  id: string; // UUID
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  restaurant_id?: string; // UUID
  kitchen_station_id?: string; // UUID
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  // Auth-related properties
  password_hash?: string;
  last_login?: string;
  login_attempts?: number;
  locked_until?: string | null;
  // Legacy properties for backwards compatibility
  kitchen_station?: string;
  table?: number;
  preferred_language?: string;
}

export interface MenuCategory {
  id: string; // UUID
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  restaurant_id: string;
  menu_items_count?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface MenuItem {
  id: string; // UUID
  name: string;
  description: string;
  price: number;
  category_id: string; // UUID reference to MenuCategory
  category?: MenuCategory; // Optional joined data
  prepTime: number;
  rating: number;
  image: string;
  popular?: boolean;
  available: boolean;
  kitchen_stations: string[]; // Multiple kitchen stations
  is_veg: boolean;
  cuisine_type: string;
  customizations?: MenuCustomization[];
  add_ons?: MenuAddOn[];
}

export interface MenuCustomization {
  id: string; // UUID
  name: string;
  price_variation: number;
  type: 'size' | 'quantity' | 'preparation';
}

export interface MenuAddOn {
  id: string; // UUID
  menu_item_id: string; // UUID
  name: string;
  price: number;
  available: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  special_notes?: string; // Customer special requests
  selected_customization?: MenuCustomization;
  selected_add_ons: MenuAddOn[];
}

export interface OrderItem {
  id: string; // UUID
  order_id: string; // UUID
  menu_item: MenuItem;
  quantity: number;
  special_notes?: string;
  selected_customization?: MenuCustomization;
  selected_add_ons: MenuAddOn[];
  status: 'order_received' | 'preparing' | 'prepared' | 'delivered';
  kitchen_station: string;
  preparation_start_time?: Date;
  preparation_end_time?: Date;
  delivery_time?: Date;
  price_at_time: number;
}

export interface Order {
  id: string; // UUID
  table: number;
  customer_name: string;
  customer_phone?: string;
  items: OrderItem[];
  status: 'active' | 'completed' | 'cancelled';
  waiter_id?: string; // UUID
  waiter_name?: string;
  timestamp: Date;
  total: number;
  estimated_time: number;
  is_joined_order: boolean; // Whether this is part of a joined table order
  parent_order_id?: string; // UUID for joined orders
}

export interface Table {
  id: string; // UUID
  table_number: number;
  status: 'available' | 'occupied' | 'needs_reset';
  waiter_id?: string; // UUID
  waiter_name?: string;
  guests: number;
  revenue: number;
  qr_code: string;
  current_orders: Order[];
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date; // Soft delete timestamp
}

export interface KitchenStation {
  id: string; // UUID
  name: string;
  cuisine_types: string[];
  assigned_staff: string[];
  is_active: boolean;
}

export interface Notification {
  id: string; // UUID
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  user_id?: string; // UUID
  order_id?: string; // UUID
  item_id?: string; // UUID
  read: boolean;
  created_at: Date;
}

export interface Restaurant {
  id: string; // UUID
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  cuisine_type: string;
  subscription_plan: 'starter' | 'professional' | 'enterprise';
  subscription_status: 'active' | 'inactive' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  max_tables: number;
  max_menu_items: number;
  max_kitchen_stations: number;
  max_languages: number;
  features: string[];
}

export type UserRole = 'customer' | 'admin' | 'waiter' | 'chef' | 'owner';

export type ItemStatus = 'order_received' | 'preparing' | 'prepared' | 'delivered';

export type TableStatus = 'available' | 'occupied' | 'needs_reset';

export type OrderStatus = 'active' | 'completed' | 'cancelled'; 