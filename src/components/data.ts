import { User, MenuItem, Order, Table } from './types';

// Dummy Data
export const dummyUsers: Record<string, User> = {
  'QR001': { id: 1, name: 'John Doe', table: 5, role: 'customer' },
  'QR002': { id: 2, name: 'Jane Smith', table: 3, role: 'customer' },
  'QR003': { id: 3, name: 'Bob Wilson', table: 7, role: 'customer' },
  'ADMIN001': { id: 4, name: 'Mike Admin', role: 'admin' },
  'WAITER001': { id: 5, name: 'Sarah Waiter', role: 'waiter' },
  'CHEF001': { id: 6, name: 'Gordon Chef', role: 'chef' }
};

export const dummyMenu: MenuItem[] = [
  { id: 1, name: 'Margherita Pizza', price: 599, category: 'Main', prepTime: 15, rating: 4.8, image: '🍕', popular: true },
  { id: 2, name: 'Caesar Salad', price: 399, category: 'Starter', prepTime: 5, rating: 4.5, image: '🥗' },
  { id: 3, name: 'Grilled Salmon', price: 899, category: 'Main', prepTime: 20, rating: 4.9, image: '🐟', popular: true },
  { id: 4, name: 'Chocolate Cake', price: 299, category: 'Dessert', prepTime: 3, rating: 4.7, image: '🍰' },
  { id: 5, name: 'Espresso Coffee', price: 199, category: 'Beverage', prepTime: 2, rating: 4.6, image: '☕' },
  { id: 6, name: 'Mushroom Risotto', price: 799, category: 'Main', prepTime: 18, rating: 4.4, image: '🍚' },
  { id: 7, name: 'Tiramisu', price: 399, category: 'Dessert', prepTime: 3, rating: 4.8, image: '🍮', popular: true },
  { id: 8, name: 'Fresh Juice', price: 249, category: 'Beverage', prepTime: 3, rating: 4.3, image: '🧃' }
];

export const initialOrders: Order[] = [
  { 
    id: 1, 
    table: 5, 
    customerName: 'John Doe',
    items: [
      { ...dummyMenu[0], quantity: 2 },
      { ...dummyMenu[1], quantity: 1 }
    ], 
    status: 'preparing', 
    waiter: 'Sarah Waiter',
    timestamp: new Date(Date.now() - 300000),
    total: 1597,
    estimatedTime: 12
  },
  { 
    id: 2, 
    table: 3, 
    customerName: 'Jane Smith',
    items: [
      { ...dummyMenu[2], quantity: 1 },
      { ...dummyMenu[4], quantity: 2 }
    ], 
    status: 'pending', 
    waiter: 'Sarah Waiter',
    timestamp: new Date(Date.now() - 120000),
    total: 1297,
    estimatedTime: 20
  }
];

export const initialTables: Table[] = [
  { id: 1, status: 'occupied', waiter: 'Sarah Waiter', guests: 4, revenue: 2275 },
  { id: 2, status: 'available', waiter: null, guests: 0, revenue: 0 },
  { id: 3, status: 'occupied', waiter: 'Sarah Waiter', guests: 2, revenue: 1297 },
  { id: 4, status: 'cleaning', waiter: 'Sarah Waiter', guests: 0, revenue: 0 },
  { id: 5, status: 'occupied', waiter: 'Sarah Waiter', guests: 3, revenue: 1597 },
  { id: 6, status: 'available', waiter: null, guests: 0, revenue: 0 },
  { id: 7, status: 'available', waiter: null, guests: 0, revenue: 0 },
  { id: 8, status: 'occupied', waiter: 'Sarah Waiter', guests: 6, revenue: 4472 }
]; 