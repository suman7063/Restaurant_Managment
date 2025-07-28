// Type definitions for Restaurant Management System
export interface User {
  id: number;
  name: string;
  table?: number;
  role: string;
}

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  prepTime: number;
  rating: number;
  image: string;
  popular?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: number;
  table: number;
  customerName: string;
  items: CartItem[];
  status: string;
  waiter: string;
  timestamp: Date;
  total: number;
  estimatedTime: number;
}

export interface Table {
  id: number;
  status: string;
  waiter: string | null;
  guests: number;
  revenue: number;
}

export interface Notification {
  id: number;
  message: string;
  type: string;
}

export type UserRole = 'customer' | 'admin' | 'waiter' | 'chef'; 