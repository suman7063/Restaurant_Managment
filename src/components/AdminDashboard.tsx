import React from 'react';
import { Users, TrendingUp, ShoppingCart, CheckCircle, Clock } from 'lucide-react';
import { User, Order, Table } from './types';
import { formatCurrency, getStatusColor, getTableStatusColor } from './utils';

interface AdminDashboardProps {
  currentUser: User;
  setCurrentUser: (user: User | null) => void;
  orders: Order[];
  tables: Table[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  setCurrentUser,
  orders,
  tables
}) => {
  // Calculate dynamic table status based on orders
  const getTableStatus = (tableId: number) => {
    const tableOrders = orders.filter(order => order.table === tableId && order.status !== 'delivered');
    if (tableOrders.length > 0) {
      return 'occupied';
    }
    // If original status is cleaning and no active order, keep as cleaning
    const orig = tables.find(t => t.id === tableId);
    if (orig?.status === 'cleaning') return 'cleaning';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <p className="text-3xl font-bold text-blue-600">{occupiedTables}/{tables.length}</p>
                <p className="text-xs text-blue-500 mt-1">{Math.round((occupiedTables/tables.length)*100)}% occupancy</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-3xl font-bold text-orange-600">{orders.filter(o => o.status !== 'delivered').length}</p>
                <p className="text-xs text-orange-500 mt-1">{pendingOrders} pending</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <ShoppingCart className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-purple-600">{totalOrders}</p>
                <p className="text-xs text-purple-500 mt-1">Today</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tables Overview */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Users className="w-6 h-6 text-blue-600" />
              <span>Tables Status</span>
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {dynamicTables.map((table, index) => (
                <div 
                  key={table.id} 
                  className="text-center transform hover:scale-110 transition-all duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`w-16 h-16 rounded-2xl ${getTableStatusColor(table.status)} flex items-center justify-center text-white font-bold text-lg mx-auto mb-2 shadow-lg transition-all duration-300`}>
                    {table.id}
                  </div>
                  <p className="text-xs font-medium capitalize text-gray-700">{table.status}</p>
                  {table.guests > 0 && (
                    <p className="text-xs text-gray-500">{table.guests} guests</p>
                  )}
                  {table.revenue > 0 && (
                    <p className="text-xs text-green-600 font-bold">{formatCurrency(table.revenue)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Clock className="w-6 h-6 text-orange-600" />
              <span>Recent Orders</span>
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {orders.slice(-6).reverse().map((order, index) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                      #{order.id}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Table {order.table}</p>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(order.total)} • {order.items.length} items</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 