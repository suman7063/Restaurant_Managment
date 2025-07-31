import React from 'react';
import { TrendingUp, Utensils, ShoppingCart, Clock, CheckCircle, Plus, Users, BarChart3, Settings, Eye, RefreshCw } from 'lucide-react';
import { Order, Table } from '../types';
import { formatCurrency, getOrderStatusColor } from '../utils';

interface HomePageProps {
  orders: Order[];
  tables: Table[];
  totalRevenue: number;
}

const HomePage: React.FC<HomePageProps> = ({ 
  orders, 
  tables, 
  totalRevenue 
}) => {
  const occupiedTables = tables.filter(table => table.status === 'occupied').length;
  const totalOrders = orders.length;
  const activeOrders = orders.filter(order => order.status === 'active').length;

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    // This would typically navigate to the specific page
    // For now, we'll just show an alert or you can implement actual navigation
    console.log(`Quick action clicked: ${action}`);
    alert(`Navigating to ${action} page...`);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600 mt-1">Real-time restaurant performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Data</span>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button 
          onClick={() => handleQuickAction('reports')}
          className="group bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg border border-green-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-500 cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-800">{formatCurrency(totalRevenue)}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <p className="text-xs text-green-600">↗ 12% from yesterday</p>
              </div>
            </div>
            <div className="bg-green-200 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-8 h-8 text-green-700" />
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => handleQuickAction('tables')}
          className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg border border-blue-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-500 cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Occupied Tables</p>
              <p className="text-3xl font-bold text-blue-800">{occupiedTables}</p>
              <div className="flex items-center mt-2">
                <div className="w-16 bg-blue-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${(occupiedTables / tables.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600">of {tables.length} total</p>
              </div>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Utensils className="w-8 h-8 text-blue-700" />
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => handleQuickAction('orders')}
          className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg border border-purple-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-500 cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-purple-800">{totalOrders}</p>
              <div className="flex items-center mt-2">
                <CheckCircle className="w-4 h-4 text-purple-600 mr-1" />
                <p className="text-xs text-purple-600">Today&apos;s orders</p>
              </div>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <ShoppingCart className="w-8 h-8 text-purple-700" />
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => handleQuickAction('orders')}
          className="group bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-lg border border-orange-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-500 cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700 mb-1">Active Orders</p>
              <p className="text-3xl font-bold text-orange-800">{activeOrders}</p>
              <div className="flex items-center mt-2">
                <Clock className="w-4 h-4 text-orange-600 mr-1" />
                <p className="text-xs text-orange-600">In progress</p>
              </div>
            </div>
            <div className="bg-orange-200 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-8 h-8 text-orange-700" />
            </div>
          </div>
        </button>
      </div>

      {/* Enhanced Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
            <button 
              onClick={() => handleQuickAction('orders')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 transition-colors duration-300"
            >
              <Eye className="w-4 h-4" />
              View All
            </button>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order, index) => (
              <div 
                key={order.id} 
                className="group flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-md transition-all duration-300 cursor-pointer transform hover:scale-102"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-800 transition-colors">
                    Order #{order.id} - Table {order.table}
                  </p>
                  <p className="text-sm text-gray-600">{order.customer_name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getOrderStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleQuickAction('new-order')}
              className="group bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-200 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300 mb-2">
                  <Plus className="w-6 h-6 text-green-700" />
                </div>
                <span className="font-semibold text-green-800">New Order</span>
                <span className="text-xs text-green-600 mt-1">Create order</span>
              </div>
            </button>
            
            <button 
              onClick={() => handleQuickAction('staff')}
              className="group bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-200 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300 mb-2">
                  <Users className="w-6 h-6 text-blue-700" />
                </div>
                <span className="font-semibold text-blue-800">Manage Staff</span>
                <span className="text-xs text-blue-600 mt-1">View employees</span>
              </div>
            </button>
            
            <button 
              onClick={() => handleQuickAction('reports')}
              className="group bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-purple-200 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300 mb-2">
                  <BarChart3 className="w-6 h-6 text-purple-700" />
                </div>
                <span className="font-semibold text-purple-800">Reports</span>
                <span className="text-xs text-purple-600 mt-1">View analytics</span>
              </div>
            </button>
            
            <button 
              onClick={() => handleQuickAction('settings')}
              className="group bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-orange-200 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300 mb-2">
                  <Settings className="w-6 h-6 text-orange-700" />
                </div>
                <span className="font-semibold text-orange-800">Settings</span>
                <span className="text-xs text-orange-600 mt-1">Configure</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 