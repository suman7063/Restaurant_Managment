import React, { useState, useEffect } from 'react';
import { User, Clock, ChefHat, AlertCircle, CheckCircle, Timer, Phone, MessageSquare } from 'lucide-react';
import { OrderItem } from './types';
import { formatCurrency } from './utils';

interface CustomerOrderKitchenProps {
  orderItem: OrderItem;
  customerName: string;
  customerPhone?: string;
  orderTimestamp: Date;
  onStatusUpdate: (itemId: string, newStatus: string) => void;
  isUpdating: boolean;
  kitchenStations?: string[];
  currentStation?: string;
}

const CustomerOrderKitchen: React.FC<CustomerOrderKitchenProps> = ({
  orderItem,
  customerName,
  customerPhone,
  orderTimestamp,
  onStatusUpdate,
  isUpdating,
  kitchenStations = [],
  currentStation
}) => {
  const [preparationTime, setPreparationTime] = useState<number>(0);
  const [isUrgent, setIsUrgent] = useState<boolean>(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const orderTime = new Date(orderTimestamp);
      const timeSinceOrder = now.getTime() - orderTime.getTime();
      const minutesSinceOrder = Math.floor(timeSinceOrder / (1000 * 60));
      
      setPreparationTime(minutesSinceOrder);
      setIsUrgent(minutesSinceOrder > 15); // Urgent if more than 15 minutes
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [orderTimestamp]);

  const getStatusColor = (status: OrderItem['status']) => {
    switch (status) {
      case 'order_received':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
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
        return <Clock className="w-4 h-4" />;
      case 'preparing':
        return <ChefHat className="w-4 h-4" />;
      case 'prepared':
        return <CheckCircle className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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

  const handleStatusUpdate = async (newStatus: OrderItem['status']) => {
    await onStatusUpdate(orderItem.id, newStatus);
  };

  const isCurrentStationItem = currentStation && orderItem.kitchen_station === currentStation;
  const nextStatus = getNextStatus(orderItem.status);

  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 ${
      isUrgent ? 'border-red-300 bg-red-50' : 
      isCurrentStationItem ? 'border-orange-300 bg-orange-50' : 
      'border-gray-200 bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{customerName}</div>
            {customerPhone && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Phone className="w-3 h-3" />
                <span>{customerPhone}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isUrgent && (
            <div className="flex items-center space-x-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
              <AlertCircle className="w-3 h-3" />
              <span>URGENT</span>
            </div>
          )}
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(orderItem.status)}`}>
            {getStatusIcon(orderItem.status)}
            <span className="ml-1">{orderItem.status.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Item Details */}
      <div className="bg-white border border-gray-100 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-gray-900">{orderItem.menu_item.name}</h4>
            <span className="text-sm text-gray-500">x{orderItem.quantity}</span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              {formatCurrency(orderItem.price_at_time * orderItem.quantity)}
            </div>
            <div className="text-xs text-gray-500">
              {formatCurrency(orderItem.price_at_time)} each
            </div>
          </div>
        </div>

        {/* Kitchen Station */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <ChefHat className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">
              {orderItem.kitchen_station || 'Unassigned'}
            </span>
            {isCurrentStationItem && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                YOUR STATION
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Timer className="w-4 h-4" />
            <span>{preparationTime}m ago</span>
          </div>
        </div>

        {/* Customizations and Add-ons */}
        {(orderItem.selected_customization || orderItem.selected_add_ons?.length > 0) && (
          <div className="border-t border-gray-100 pt-2 mt-2">
            {orderItem.selected_customization && (
              <div className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Customization:</span> {orderItem.selected_customization.name}
                {orderItem.selected_customization.price_variation !== 0 && (
                  <span className="text-gray-500 ml-1">
                    ({orderItem.selected_customization.price_variation > 0 ? '+' : ''}
                    {formatCurrency(orderItem.selected_customization.price_variation)})
                  </span>
                )}
              </div>
            )}
            {orderItem.selected_add_ons?.length > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Add-ons:</span> {orderItem.selected_add_ons.map(addon => addon.name).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Special Instructions */}
        {orderItem.special_notes && (
          <div className="border-t border-gray-100 pt-2 mt-2">
            <div className="flex items-start space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600">
                <span className="font-medium">Special Instructions:</span> {orderItem.special_notes}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preparation Timing */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="font-medium text-gray-700">Prep Time</div>
          <div className="text-gray-900">{orderItem.menu_item.prepTime} min</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="font-medium text-gray-700">Time Since Order</div>
          <div className={`font-semibold ${isUrgent ? 'text-red-600' : 'text-gray-900'}`}>
            {preparationTime} min
          </div>
        </div>
      </div>

      {/* Status Update Buttons */}
      {nextStatus && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Order #{orderItem.order_id.slice(-6)}
          </div>
          <button
            onClick={() => handleStatusUpdate(nextStatus)}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isUpdating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isUpdating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Updating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {getStatusIcon(nextStatus)}
                <span>Mark as {nextStatus.replace('_', ' ')}</span>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Preparation Progress */}
      {orderItem.status === 'preparing' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Preparation Progress</span>
            <span className="text-gray-900">
              {orderItem.preparation_start_time ? (
                `Started at ${new Date(orderItem.preparation_start_time).toLocaleTimeString()}`
              ) : (
                'Not started'
              )}
            </span>
          </div>
        </div>
      )}

      {/* Completion Info */}
      {orderItem.status === 'prepared' && orderItem.preparation_end_time && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Prepared at</span>
            <span className="text-green-600 font-medium">
              {new Date(orderItem.preparation_end_time).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {orderItem.status === 'delivered' && orderItem.delivery_time && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Delivered at</span>
            <span className="text-green-600 font-medium">
              {new Date(orderItem.delivery_time).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrderKitchen; 