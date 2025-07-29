// Type definitions for Restaurant Management System
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  qr_code: string;
  language: Language;
  kitchen_station?: string;
  table?: number;
}

export interface MenuItem {
  id: number;
  name: string;
  name_hi?: string; // Hindi translation
  name_kn?: string; // Kannada translation
  description: string;
  description_hi?: string;
  description_kn?: string;
  price: number;
  category: string;
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
  id: number;
  name: string;
  name_hi?: string;
  name_kn?: string;
  price_variation: number;
  type: 'size' | 'quantity' | 'preparation';
}

export interface MenuAddOn {
  id: number;
  menu_item_id: number;
  name: string;
  name_hi?: string;
  name_kn?: string;
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
  id: number;
  order_id: number;
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
  id: number;
  table: number;
  customer_name: string;
  customer_phone?: string;
  items: OrderItem[];
  status: 'active' | 'completed' | 'cancelled';
  waiter_id?: string;
  waiter_name?: string;
  timestamp: Date;
  total: number;
  estimated_time: number;
  is_joined_order: boolean; // Whether this is part of a joined table order
  parent_order_id?: number; // For joined orders
}

export interface Table {
  id: number;
  table_number: number;
  status: 'available' | 'occupied' | 'needs_reset';
  waiter_id?: string;
  waiter_name?: string;
  guests: number;
  revenue: number;
  qr_code: string;
  current_orders: Order[];
  created_at: Date;
  updated_at: Date;
}

export interface KitchenStation {
  id: number;
  name: string;
  name_hi?: string;
  name_kn?: string;
  cuisine_types: string[];
  assigned_staff: string[];
  is_active: boolean;
}

export interface Notification {
  id: number;
  message: string;
  message_hi?: string;
  message_kn?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  user_id?: string;
  order_id?: number;
  item_id?: number;
  read: boolean;
  created_at: Date;
}

export interface Restaurant {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  cuisine_type: string;
  languages: string[];
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

export type Language = 'en' | 'hi' | 'kn';

export type ItemStatus = 'order_received' | 'preparing' | 'prepared' | 'delivered';

export type TableStatus = 'available' | 'occupied' | 'needs_reset';

export type OrderStatus = 'active' | 'completed' | 'cancelled'; 