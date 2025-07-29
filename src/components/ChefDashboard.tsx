import React from 'react';
import { ChefHat, Clock, CheckCircle } from 'lucide-react';
import { User, Order, MenuItem } from './types';
import { getStatusColor } from './utils';

interface ChefDashboardProps {
  currentUser: User;
  setCurrentUser: (user: User | null) => void;
  orders: Order[];
  dummyMenu: MenuItem[];
  onUpdateOrderStatus: (orderId: number, newStatus: string) => void;
}

const ChefDashboard: React.FC<ChefDashboardProps> = ({
  currentUser,
  setCurrentUser,
  orders,
  dummyMenu,
  onUpdateOrderStatus
}) => {
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const preparingOrdersCount = orders.filter(o => o.status === 'preparing').length;
  const readyOrdersCount = orders.filter(o => o.status === 'ready').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-red-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-3 rounded-xl">
              <ChefHat className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kitchen Dashboard</h1>
              <p className="text-gray-600">Welcome, {currentUser.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-xl font-medium flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>{pendingOrdersCount} New Orders</span>
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

      <div className="max-w-7xl mx-auto p-6">
        {/* Kitchen Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingOrdersCount}</p>
                <p className="text-xs text-yellow-500 mt-1">Waiting to start</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Preparing</p>
                <p className="text-3xl font-bold text-blue-600">{preparingOrdersCount}</p>
                <p className="text-xs text-blue-500 mt-1">In progress</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <ChefHat className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready</p>
                <p className="text-3xl font-bold text-green-600">{readyOrdersCount}</p>
                <p className="text-xs text-green-500 mt-1">Ready for pickup</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Queue */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <ChefHat className="w-6 h-6 text-red-600" />
            <span>Orders Queue</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.filter(order => order.status !== 'delivered').map((order, index) => (
              <div 
                key={order.id} 
                className="border-2 border-gray-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-lg text-gray-900">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">Table {order.table}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    {order.estimatedTime && (
                      <p className="text-xs text-orange-600 font-bold mt-1">~{order.estimatedTime} min</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center space-x-2 text-black">
                        <span className="text-lg">{dummyMenu.find(m => m.id === item.id)?.image}</span>
                        <span>{item.quantity}x {item.name}</span>
                      </div>
                      <span className="text-gray-500 font-medium">{item.prepTime}min</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-bold text-sm flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Start Cooking</span>
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-bold text-sm flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark Ready</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {orders.filter(order => order.status !== 'delivered').length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👨‍🍳</div>
              <p className="text-gray-500 text-lg">Kitchen is all caught up!</p>
              <p className="text-gray-400 text-sm mt-2">No orders in queue</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChefDashboard; 