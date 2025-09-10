import React from 'react';
import { Order } from './types';
import { formatCurrency } from './utils';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  LogOut,
  RefreshCw
} from 'lucide-react';

interface SessionOrdersDisplayProps {
  orders: Order[];
  currentUser: any;
  onExitSession: () => void;
  onRefreshOrders: () => void;
  loading?: boolean;
}

const SessionOrdersDisplay: React.FC<SessionOrdersDisplayProps> = ({
  orders,
  currentUser,
  onExitSession,
  onRefreshOrders,
  loading = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'preparing': return <RefreshCw className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'served': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Session Orders</h3>
            <p className="text-sm text-gray-600">{orders.length} orders in this session</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefreshOrders}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onExitSession}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Session</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No orders placed yet</p>
            <p className="text-gray-400 text-sm">Be the first to place an order!</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-lg p-4">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.id.slice(-6)}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="w-3 h-3" />
                      <span>{order.customer_name}</span>
                      {order.customer_id === currentUser?.id && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(order.total)}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    {getStatusIcon(order.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2 mb-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">×{item.quantity}</span>
                      <span className="font-medium">{item.menu_item.name}</span>
                    </div>
                    <span className="text-gray-900">
                      {formatCurrency(item.price_at_time * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>Placed at {formatTime(order.timestamp)}</span>
                <span>{order.items.length} items</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Session Summary */}
      {orders.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Session Total:</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">Total Orders:</span>
            <span className="text-sm font-medium text-gray-700">{orders.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionOrdersDisplay;

