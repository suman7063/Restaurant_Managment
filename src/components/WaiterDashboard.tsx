import React from 'react';
import { UserCheck, Users, ShoppingCart, Bell, CheckCircle } from 'lucide-react';
import { User, Order, Table } from './types';
import { formatCurrency, getStatusColor, getTableStatusColor } from './utils';

interface WaiterDashboardProps {
  currentUser: User;
  setCurrentUser: (user: User | null) => void;
  orders: Order[];
  tables: Table[];
  onUpdateOrderStatus: (orderId: number, newStatus: string) => void;
}

const WaiterDashboard: React.FC<WaiterDashboardProps> = ({
  currentUser,
  setCurrentUser,
  orders,
  tables,
  onUpdateOrderStatus
}) => {
  const myTables = tables.filter(table => table.waiter === currentUser.name);
  const myOrders = orders.filter(order => order.waiter === currentUser.name && order.status !== 'delivered');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-green-100">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-xl">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Waiter Dashboard</h1>
              <p className="text-gray-600">Welcome, {currentUser.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl font-medium flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>{myOrders.length} Active Orders</span>
            </div>
            <button
              onClick={() => setCurrentUser(null)}
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Tables */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Users className="w-6 h-6 text-green-600" />
              <span>My Tables ({myTables.length})</span>
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {myTables.map((table, index) => (
                <div 
                  key={table.id} 
                  className="text-center p-4 border-2 border-gray-100 rounded-xl hover:border-green-300 transition-all duration-300 transform hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-16 h-16 rounded-2xl ${getTableStatusColor(table.status)} flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-lg`}>
                    {table.id}
                  </div>
                  <p className="text-sm font-bold capitalize text-gray-800">{table.status}</p>
                  {table.guests > 0 && (
                    <p className="text-xs text-gray-600">{table.guests} guests</p>
                  )}
                  {table.revenue > 0 && (
                    <p className="text-xs text-green-600 font-bold mt-1">{formatCurrency(table.revenue)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Active Orders */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
              <span>Active Orders</span>
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {myOrders.map((order, index) => (
                <div 
                  key={order.id} 
                  className="border-2 border-gray-100 rounded-xl p-4 hover:border-green-300 transition-all duration-300 transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-lg text-gray-900">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">Table {order.table} • {order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.items.length} items • {formatCurrency(order.total)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      {order.estimatedTime && (
                        <p className="text-xs text-gray-500 mt-1">~{order.estimatedTime} min</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700 mb-4 space-y-1">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between">
                        <span>• {item.quantity}x {item.name}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  
                  {order.status === 'ready' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-bold flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Mark as Delivered</span>
                    </button>
                  )}
                </div>
              ))}
              
              {myOrders.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-gray-500 text-lg">All caught up!</p>
                  <p className="text-gray-400 text-sm mt-2">No active orders right now</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaiterDashboard; 