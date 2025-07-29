import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  ShoppingCart, 
  Clock, 
  Home,
  Utensils,
  UserCheck,
  Settings,
  BarChart3,
  FileText
} from 'lucide-react';
import { User, Order, Table } from './types';
import { formatCurrency, getOrderStatusColor, getTableStatusColor } from './utils';

interface AdminDashboardProps {
  currentUser: User;
  setCurrentUser: (user: User | null) => void;
  orders: Order[];
  tables: Table[];
}

type AdminPage = 'home' | 'tables' | 'waiters' | 'chefs' | 'menu' | 'orders' | 'reports' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  setCurrentUser,
  orders,
  tables
}) => {
  const [currentPage, setCurrentPage] = useState<AdminPage>('home');

  // Calculate dynamic table status based on orders
  const getTableStatus = (tableId: number) => {
    const tableOrders = orders.filter(order => order.table === tableId && order.status !== 'completed');
    if (tableOrders.length > 0) {
      return 'occupied';
    }
    return 'available';
  };

  const getTableGuests = (tableId: number) => {
    const tableOrder = orders.find(order => order.table === tableId && order.status !== 'delivered');
    if (tableOrder) {
      return tableOrder.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    return 0;
  };

  const getTableRevenue = (tableId: number) => {
    const tableOrder = orders.find(order => order.table === tableId && order.status !== 'delivered');
    if (tableOrder) {
      return tableOrder.total;
    }
    return 0;
  };

  const dynamicTables = tables.map(table => ({
    ...table,
    status: getTableStatus(table.id),
    guests: getTableGuests(table.id),
    revenue: getTableRevenue(table.id)
  }));

  const totalRevenue = dynamicTables.reduce((sum, table) => sum + table.revenue, 0);
  const occupiedTables = dynamicTables.filter(table => table.status === 'occupied').length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;

  // Navigation items
  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'tables', label: 'Table Management', icon: Utensils },
    { id: 'waiters', label: 'Waiter Management', icon: UserCheck },
    { id: 'chefs', label: 'Chef Management', icon: Users },
    { id: 'menu', label: 'Menu Management', icon: FileText },
    { id: 'orders', label: 'Order Management', icon: ShoppingCart },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Render different pages
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage orders={orders} tables={dynamicTables} totalRevenue={totalRevenue} />;
      case 'tables':
        return <TableManagementPage tables={dynamicTables} />;
      case 'waiters':
        return <WaiterManagementPage />;
      case 'chefs':
        return <ChefManagementPage />;
      case 'menu':
        return <MenuManagementPage />;
      case 'orders':
        return <OrderManagementPage orders={orders} />;
      case 'reports':
        return <ReportsPage orders={orders} tables={dynamicTables} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage orders={orders} tables={dynamicTables} totalRevenue={totalRevenue} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-xl">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {currentUser.name}</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentUser(null)}
            className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            Exit
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 h-fit">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id as AdminPage)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                      currentPage === item.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Home Page Component
const HomePage: React.FC<{ orders: Order[]; tables: Table[]; totalRevenue: number }> = ({ 
  orders, 
  tables, 
  totalRevenue 
}) => {
  const occupiedTables = tables.filter(table => table.status === 'occupied').length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-green-500 mt-1">↗ 12% from yesterday</p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupied Tables</p>
              <p className="text-3xl font-bold text-blue-600">{occupiedTables}</p>
              <p className="text-xs text-blue-500 mt-1">of {tables.length} total</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Utensils className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-purple-600">{totalOrders}</p>
              <p className="text-xs text-purple-500 mt-1">Today&apos;s orders</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <ShoppingCart className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-3xl font-bold text-orange-600">{pendingOrders}</p>
              <p className="text-xs text-orange-500 mt-1">Awaiting preparation</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h3>
        <div className="space-y-3">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Order #{order.id} - Table {order.table}</p>
                <p className="text-sm text-gray-600">{order.customerName}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getOrderStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Table Management Page
const TableManagementPage: React.FC<{ tables: Table[] }> = ({ tables }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Table Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all">
          Add New Table
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => (
          <div key={table.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Table {table.id}</h3>
                <p className="text-sm text-gray-600">{table.guests} guests</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTableStatusColor(table.status)}`}>
                {table.status}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Revenue: {formatCurrency(table.revenue)}</p>
              <p className="text-sm text-gray-600">Waiter: {table.waiter || 'Unassigned'}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 transition-all">
                Edit
              </button>
              <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-all">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Waiter Management Page
const WaiterManagementPage: React.FC = () => {
  const waiters = [
    { id: 1, name: 'Sarah Waiter', status: 'active', tables: 4, orders: 12 },
    { id: 2, name: 'John Server', status: 'active', tables: 3, orders: 8 },
    { id: 3, name: 'Maria Host', status: 'break', tables: 2, orders: 5 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Waiter Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all">
          Add New Waiter
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="space-y-4">
          {waiters.map((waiter) => (
            <div key={waiter.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {waiter.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{waiter.name}</p>
                  <p className="text-sm text-gray-600">{waiter.tables} tables assigned</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  waiter.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {waiter.status}
                </span>
                <p className="text-sm text-gray-600">{waiter.orders} orders</p>
                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Chef Management Page
const ChefManagementPage: React.FC = () => {
  const chefs = [
    { id: 1, name: 'Gordon Chef', status: 'active', orders: 8, specialty: 'Main Dishes' },
    { id: 2, name: 'Julia Baker', status: 'active', orders: 5, specialty: 'Desserts' },
    { id: 3, name: 'Carlos Grill', status: 'break', orders: 3, specialty: 'Grilled Items' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Chef Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all">
          Add New Chef
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="space-y-4">
          {chefs.map((chef) => (
            <div key={chef.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                  {chef.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{chef.name}</p>
                  <p className="text-sm text-gray-600">Specialty: {chef.specialty}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  chef.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {chef.status}
                </span>
                <p className="text-sm text-gray-600">{chef.orders} orders</p>
                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Menu Management Page
const MenuManagementPage: React.FC = () => {
  const menuCategories = ['Main', 'Starter', 'Dessert', 'Beverage'];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Menu Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all">
          Add New Item
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuCategories.map((category) => (
          <div key={category} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{category}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Sample Item</p>
                  <p className="text-sm text-gray-600">$9.99</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-all">
              Add {category} Item
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Order Management Page
const OrderManagementPage: React.FC<{ orders: Order[] }> = ({ orders }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Order Management</h2>
      
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">Order #{order.id}</h3>
                  <p className="text-sm text-gray-600">Table {order.table} - {order.customerName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(order.total)}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getOrderStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 mb-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-all">
                  Update Status
                </button>
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-all">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Reports Page
const ReportsPage: React.FC<{ orders: Order[]; tables: Table[] }> = ({ orders, tables }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Reports & Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Revenue Analytics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Today's Revenue</span>
              <span className="font-bold">{formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}</span>
            </div>
            <div className="flex justify-between">
              <span>Average Order Value</span>
              <span className="font-bold">{formatCurrency(orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Orders</span>
              <span className="font-bold">{orders.length}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Table Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Occupied Tables</span>
              <span className="font-bold">{tables.filter(t => t.status === 'occupied').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Available Tables</span>
              <span className="font-bold">{tables.filter(t => t.status === 'available').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Utilization Rate</span>
              <span className="font-bold">{Math.round((tables.filter(t => t.status === 'occupied').length / tables.length) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {orders.slice(0, 10).map((order) => (
            <div key={order.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>Order #{order.id} placed</span>
              <span className="text-sm text-gray-600">
                {new Date(order.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Settings Page
const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
      
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Restaurant Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
            <input type="text" className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" defaultValue="Restaurant Management System" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Hours</label>
            <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" defaultValue="9:00 AM - 10:00 PM" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
            <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" defaultValue="admin@restaurant.com" />
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 