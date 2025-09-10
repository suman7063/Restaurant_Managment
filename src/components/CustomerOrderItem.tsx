import React from 'react';
import { Clock, User, Phone, ShoppingCart, CheckCircle, AlertCircle } from 'lucide-react';
import { OrderItem } from './types';
import { formatCurrency } from './utils';

interface CustomerOrderItemProps {
  orderItem: OrderItem;
  customerName: string;
  customerPhone?: string;
  orderTimestamp: Date;
  onStatusUpdate?: (itemId: string, newStatus: OrderItem['status']) => void;
  isUpdating?: boolean;
}

const CustomerOrderItem: React.FC<CustomerOrderItemProps> = ({
  orderItem,
  customerName,
  customerPhone,
  orderTimestamp,
  onStatusUpdate,
  isUpdating = false
}) => {
  const getStatusColor = (status: OrderItem['status']) => {
    switch (status) {
      case 'order_received':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'prepared':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: OrderItem['status']) => {
    switch (status) {
      case 'order_received':
        return <AlertCircle className="w-4 h-4" />;
      case 'preparing':
        return <Clock className="w-4 h-4" />;
      case 'prepared':
        return <ShoppingCart className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getNextStatus = (currentStatus: OrderItem['status']): OrderItem['status'] | null => {
    switch (currentStatus) {
      case 'order_received':
        return 'preparing';
      case 'preparing':
        return 'prepared';
      case 'prepared':
        return 'delivered';
      default:
        return null;
    }
  };

  const handleStatusUpdate = () => {
    const nextStatus = getNextStatus(orderItem.status);
    if (nextStatus && onStatusUpdate) {
      onStatusUpdate(orderItem.id, nextStatus);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
      {/* Customer Information Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{customerName}</h4>
            {customerPhone && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Phone className="w-3 h-3" />
                <span>{customerPhone}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatTime(orderTimestamp)}</span>
          </div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(orderItem.status)}`}>
            {getStatusIcon(orderItem.status)}
            <span className="ml-1 capitalize">{orderItem.status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Order Item Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h5 className="font-medium text-gray-900">{orderItem.menu_item.name}</h5>
            {orderItem.special_notes && (
              <p className="text-sm text-gray-600 italic">"{orderItem.special_notes}"</p>
            )}
            {orderItem.selected_customization && (
              <p className="text-sm text-blue-600">
                Customization: {orderItem.selected_customization.name}
              </p>
            )}
            {orderItem.selected_add_ons && orderItem.selected_add_ons.length > 0 && (
              <div className="text-sm text-green-600">
                Add-ons: {orderItem.selected_add_ons.map(addon => addon.name).join(', ')}
              </div>
            )}
          </div>
          <div className="text-right ml-4">
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(orderItem.price_at_time * orderItem.quantity)}
            </div>
            <div className="text-sm text-gray-500">
              {orderItem.quantity}x @ {formatCurrency(orderItem.price_at_time)}
            </div>
          </div>
        </div>

        {/* Kitchen Station */}
        {orderItem.kitchen_station && (
          <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            Kitchen Station: {orderItem.kitchen_station}
          </div>
        )}

        {/* Status Update Button */}
        {orderItem.status !== 'delivered' && onStatusUpdate && (
          <button
            onClick={handleStatusUpdate}
            disabled={isUpdating}
            className={`w-full mt-3 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
              isUpdating
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
            }`}
          >
            {isUpdating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Updating...</span>
              </div>
            ) : (
              <span>Mark as {getNextStatus(orderItem.status)?.replace('_', ' ')}</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomerOrderItem; 