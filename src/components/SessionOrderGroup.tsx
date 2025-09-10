import React, { useState, useEffect } from 'react';
import { Users, Clock, DollarSign, ShoppingCart, ChefHat, Timer, AlertCircle, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Session, Order, SessionCustomer } from './types';
import { formatCurrency } from './utils';
import CustomerOrderKitchen from './CustomerOrderKitchen';

interface SessionOrderGroupProps {
  session: Session;
  orders: Order[];
  customers: SessionCustomer[];
  onOrderStatusUpdate?: (orderId: string, itemId: string, newStatus: string) => void;
  onSessionAction?: (sessionId: string, action: 'view' | 'bill' | 'close') => void;
  isExpanded?: boolean;
  onToggleExpanded?: (sessionId: string) => void;
  kitchenStations?: string[];
  currentStation?: string;
}

const SessionOrderGroup: React.FC<SessionOrderGroupProps> = ({
  session,
  orders,
  customers,
  onOrderStatusUpdate,
  onSessionAction,
  isExpanded = false,
  onToggleExpanded,
  kitchenStations = [],
  currentStation
}) => {
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [sessionStats, setSessionStats] = useState({
    totalItems: 0,
    pendingItems: 0,
    preparingItems: 0,
    preparedItems: 0,
    deliveredItems: 0,
    sessionDuration: 0,
    urgentItems: 0
  });

  useEffect(() => {
    calculateSessionStats();
  }, [orders, session]);

  const calculateSessionStats = () => {
    const now = new Date();
    const sessionStart = new Date(session.created_at);
    const durationMs = now.getTime() - sessionStart.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    let totalItems = 0;
    let pendingItems = 0;
    let preparingItems = 0;
    let preparedItems = 0;
    let deliveredItems = 0;
    let urgentItems = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        totalItems += item.quantity;
        
        // Check if item is urgent (pending for more than 15 minutes)
        const orderTime = new Date(order.timestamp);
        const timeSinceOrder = now.getTime() - orderTime.getTime();
        const isUrgent = timeSinceOrder > 15 * 60 * 1000; // 15 minutes

        switch (item.status) {
          case 'order_received':
            pendingItems += item.quantity;
            if (isUrgent) urgentItems += item.quantity;
            break;
          case 'preparing':
            preparingItems += item.quantity;
            break;
          case 'prepared':
            preparedItems += item.quantity;
            break;
          case 'delivered':
            deliveredItems += item.quantity;
            break;
        }
      });
    });

    setSessionStats({
      totalItems,
      pendingItems,
      preparingItems,
      preparedItems,
      deliveredItems,
      sessionDuration: durationHours * 60 + durationMinutes,
      urgentItems
    });
  };

  const handleItemStatusUpdate = async (itemId: string, newStatus: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      if (onOrderStatusUpdate) {
        const order = orders.find(o => o.items.some(item => item.id === itemId));
        if (order) {
          await onOrderStatusUpdate(order.id, itemId, newStatus);
        }
      }
    } catch (error) {
      console.error('Failed to update item status:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getSessionStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'billed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cleared':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCustomerById = (customerId: string) => {
    return customers.find(c => c.id === customerId);
  };

  const groupedOrdersByCustomer = orders.reduce((acc, order) => {
    const customerId = order.customer_id || 'unknown';
    if (!acc[customerId]) {
      acc[customerId] = [];
    }
    acc[customerId].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  const getStationColor = (station: string) => {
    const colors = [
      'bg-red-100 text-red-800 border-red-200',
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-pink-100 text-pink-800 border-pink-200'
    ];
    const index = kitchenStations.indexOf(station);
    return colors[index % colors.length] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const isUrgent = sessionStats.urgentItems > 0;

  return (
    <div className={`bg-white rounded-xl border-2 shadow-lg hover:shadow-xl transition-all duration-200 ${
      isUrgent ? 'border-red-300 bg-red-50' : 'border-gray-200'
    }`}>
      {/* Session Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${
              isUrgent ? 'bg-red-500 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
            }`}>
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-gray-900">
                  Session #{session.session_otp}
                </h3>
                {isUrgent && (
                  <div className="flex items-center space-x-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    <AlertCircle className="w-3 h-3" />
                    <span>URGENT</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(sessionStats.sessionDuration)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{customers.length} customers</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ShoppingCart className="w-4 h-4" />
                  <span>{orders.length} orders</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSessionStatusColor(session.status)}`}>
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(session.total_amount / 100)}
              </div>
              <div className="text-sm text-gray-500">Session Total</div>
            </div>
            {onToggleExpanded && (
              <button
                onClick={() => onToggleExpanded(session.id)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Kitchen Stats */}
        <div className="grid grid-cols-6 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{sessionStats.totalItems}</div>
            <div className="text-xs text-gray-500">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">{sessionStats.pendingItems}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{sessionStats.preparingItems}</div>
            <div className="text-xs text-gray-500">Preparing</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600">{sessionStats.preparedItems}</div>
            <div className="text-xs text-gray-500">Prepared</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{sessionStats.deliveredItems}</div>
            <div className="text-xs text-gray-500">Delivered</div>
          </div>
          {isUrgent && (
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">{sessionStats.urgentItems}</div>
              <div className="text-xs text-gray-500">Urgent</div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Kitchen Station Overview */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <ChefHat className="w-5 h-5 text-orange-600" />
              <span>Kitchen Station Assignment</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {kitchenStations.map(station => {
                const stationOrders = orders.filter(order => 
                  order.items.some(item => item.kitchen_station === station)
                );
                const stationItems = stationOrders.reduce((total, order) => 
                  total + order.items.filter(item => item.kitchen_station === station).length, 0
                );
                const isCurrentStation = currentStation === station;
                
                return (
                  <div key={station} className={`border rounded-lg p-3 ${
                    isCurrentStation ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStationColor(station)}`}>
                        {station}
                      </span>
                      {isCurrentStation && (
                        <CheckCircle className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className="text-lg font-semibold text-gray-900">{stationItems}</div>
                      <div className="text-xs text-gray-500">items</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Orders by Customer */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              <span>Customer Orders</span>
            </h4>
            <div className="space-y-4">
              {Object.entries(groupedOrdersByCustomer).map(([customerId, customerOrders]) => {
                const customer = getCustomerById(customerId);
                return (
                  <div key={customerId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-gray-900">
                        {customer?.name || 'Unknown Customer'}
                      </h5>
                      <div className="text-sm text-gray-500">
                        {customerOrders.length} order{customerOrders.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {customerOrders.map(order => (
                        <div key={order.id} className="bg-white border border-gray-100 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Order #{order.id.slice(-6)}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(order.total)}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {order.items.map(item => (
                              <CustomerOrderKitchen
                                key={item.id}
                                orderItem={item}
                                customerName={customer?.name || 'Unknown Customer'}
                                customerPhone={customer?.phone}
                                orderTimestamp={order.timestamp}
                                onStatusUpdate={handleItemStatusUpdate}
                                isUpdating={updatingItems.has(item.id)}
                                kitchenStations={kitchenStations}
                                currentStation={currentStation}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Session started: {new Date(session.created_at).toLocaleString()}
            </div>
            <div className="flex space-x-3">
              {onSessionAction && (
                <>
                  <button
                    onClick={() => onSessionAction(session.id, 'view')}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                  {session.status === 'active' && (
                    <button
                      onClick={() => onSessionAction(session.id, 'bill')}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                    >
                      Generate Bill
                    </button>
                  )}
                  {session.status === 'billed' && (
                    <button
                      onClick={() => onSessionAction(session.id, 'close')}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Close Session
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionOrderGroup; 