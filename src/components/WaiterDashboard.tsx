import React, { useState, useEffect } from 'react';
import { UserCheck, Users, ShoppingCart, Bell, CheckCircle, Clock, TrendingUp, Coffee } from 'lucide-react';
import { User, Order, Table } from './types';
import { formatCurrency, getOrderStatusColor, getTableStatusColor } from './utils';

interface WaiterDashboardProps {
  currentUser: User;
  setCurrentUser: (user: User | null) => void;
  orders: Order[];
  tables: Table[];
  onUpdateOrderStatus: (orderId: string, newStatus: string) => void;
}

const WaiterDashboard: React.FC<WaiterDashboardProps> = ({
  currentUser,
  setCurrentUser,
  orders,
  tables,
  onUpdateOrderStatus
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  const myTables = tables.filter(table => table.waiter_name === currentUser.name);
  const myOrders = orders.filter(order => order.waiter_name === currentUser.name && order.status !== 'completed');

  // Simulate loading animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Simulate notification count
  useEffect(() => {
    const interval = setInterval(() => {
      setNotificationCount(prev => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOrderComplete = async (orderId: string) => {
    setActiveOrderId(orderId);
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    onUpdateOrderStatus(orderId, 'completed');
    setActiveOrderId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-green-100 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
            <div className="flex items-center space-x-4 animate-fade-in-up">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-xl shadow-lg transform hover:scale-110 transition-all duration-300">
                <UserCheck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Waiter Dashboard
                </h1>
                <p className="text-gray-600 flex items-center space-x-2">
                  <span>Welcome back,</span>
                  <span className="font-semibold text-green-700">{currentUser.name}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl font-medium flex items-center space-x-2 hover:bg-green-200 transition-all duration-300 cursor-pointer transform hover:scale-105">
                  <Bell className="w-5 h-5 animate-pulse" />
                  <span>{myOrders.length} Active Orders</span>
                  {notificationCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                      {notificationCount}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setCurrentUser(null)}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                Exit
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">My Tables</p>
                  <p className="text-3xl font-bold text-gray-900">{myTables.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Active Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{myOrders.length}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-xl">
                  <ShoppingCart className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(myTables.reduce((sum, table) => sum + table.revenue, 0))}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* My Tables */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <Users className="w-6 h-6 text-green-600" />
                <span>My Tables ({myTables.length})</span>
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {myTables.map((table, index) => (
                  <div 
                    key={table.id} 
                    className="text-center p-4 border-2 border-gray-100 rounded-xl hover:border-green-300 transition-all duration-500 transform hover:scale-110 hover:shadow-xl cursor-pointer group"
                    style={{ 
                      animationDelay: `${(index + 1) * 100}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                  >
                    <div className={`w-16 h-16 rounded-2xl ${getTableStatusColor(table.status)} flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-lg transform group-hover:rotate-12 transition-all duration-300`}>
                      {table.table_number}
                    </div>
                    <p className="text-sm font-bold capitalize text-gray-800 group-hover:text-green-700 transition-colors duration-300">{table.status}</p>
                    {table.guests > 0 && (
                      <p className="text-xs text-gray-600 flex items-center justify-center space-x-1 mt-1">
                        <Coffee className="w-3 h-3" />
                        <span>{table.guests} guests</span>
                      </p>
                    )}
                    {table.revenue > 0 && (
                      <p className="text-xs text-green-600 font-bold mt-1 animate-pulse">{formatCurrency(table.revenue)}</p>
                    )}
                  </div>
                ))}
                {myTables.length === 0 && (
                  <div className="col-span-3 text-center py-8">
                    <div className="text-4xl mb-2">🍽️</div>
                    <p className="text-gray-500">No tables assigned yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Orders */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
                <span>Active Orders</span>
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                {myOrders.map((order, index) => (
                  <div 
                    key={order.id} 
                    className="border-2 border-gray-100 rounded-xl p-4 hover:border-green-300 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-xl bg-gradient-to-r from-white to-green-50/50"
                    style={{ 
                      animationDelay: `${(index + 1) * 150}ms`,
                      animation: 'slideInRight 0.6s ease-out forwards'
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-lg text-gray-900 flex items-center space-x-2">
                          <span>Order #{order.id.slice(-6)}</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        </p>
                        <p className="text-sm text-gray-600 flex items-center space-x-2">
                          <span>Table {order.table}</span>
                          <span>•</span>
                          <span>{order.customer_name}</span>
                        </p>
                        <p className="text-xs text-gray-500 flex items-center space-x-2">
                          <span>{order.items.length} items</span>
                          <span>•</span>
                          <span className="font-semibold text-green-600">{formatCurrency(order.total)}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getOrderStatusColor(order.status)} animate-pulse`}>
                          {order.status}
                        </span>
                        {order.estimated_time && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>~{order.estimated_time} min</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-4 space-y-1">
                      {order.items.map((item, itemIndex) => (
                        <div key={item.id} className="flex justify-between hover:bg-green-50 p-1 rounded transition-colors duration-200">
                          <span className="flex items-center space-x-2">
                            <span className="text-green-600">•</span>
                            <span>{item.quantity}x {item.menu_item.name}</span>
                          </span>
                          <span className="font-medium">{formatCurrency(item.price_at_time * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {order.status === 'active' && (
                      <button
                        onClick={() => handleOrderComplete(order.id)}
                        disabled={activeOrderId === order.id}
                        className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg ${
                          activeOrderId === order.id
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                        }`}
                      >
                        {activeOrderId === order.id ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            <span>Mark as Delivered</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
                
                {myOrders.length === 0 && (
                  <div className="text-center py-12 animate-fade-in">
                    <div className="text-6xl mb-4 animate-bounce">✅</div>
                    <p className="text-gray-500 text-lg font-semibold">All caught up!</p>
                    <p className="text-gray-400 text-sm mt-2">No active orders right now</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default WaiterDashboard; 