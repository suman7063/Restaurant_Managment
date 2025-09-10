'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Users, Clock, DollarSign, ShoppingBag, User, Phone, Calendar } from 'lucide-react';
import { Order, Session, SessionCustomer } from './types';
import { sessionService } from '../lib/database';
import { orderService } from '../lib/database';

interface GroupOrderDisplayProps {
  sessionId: string;
  currentCustomerId?: string; // ID of the current user viewing the display
  onRefresh?: () => void;
  onRequestBill?: () => void;
  onRegenerateOTP?: () => void;
  onCloseSession?: () => void;
  className?: string;
}

interface CustomerOrderSummary {
  customer: SessionCustomer;
  orders: Order[];
  totalSpent: number;
  orderCount: number;
  items: Array<{
    item: any;
    quantity: number;
    price: number;
    status: string;
    customerName: string;
  }>;
}

interface SessionStatistics {
  totalParticipants: number;
  totalOrders: number;
  totalAmount: number;
  averageOrder: number;
  sessionDuration: string;
}

export const GroupOrderDisplay: React.FC<GroupOrderDisplayProps> = ({
  sessionId,
  currentCustomerId,
  onRefresh,
  onRequestBill,
  onRegenerateOTP,
  onCloseSession,
  className = ''
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [customers, setCustomers] = useState<SessionCustomer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerOrderSummaries, setCustomerOrderSummaries] = useState<CustomerOrderSummary[]>([]);
  const [statistics, setStatistics] = useState<SessionStatistics>({
    totalParticipants: 0,
    totalOrders: 0,
    totalAmount: 0,
    averageOrder: 0,
    sessionDuration: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // Load session data
  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load session, customers, and orders in parallel
      const [sessionData, customersData, ordersData] = await Promise.all([
        sessionService.getSessionById(sessionId),
        sessionService.getSessionCustomers(sessionId),
        orderService.getSessionOrders(sessionId)
      ]);

      if (!sessionData) {
        setError('Session not found');
        return;
      }

      setSession(sessionData);
      setCustomers(customersData);
      setOrders(ordersData);

      // Process customer order summaries
      const summaries: CustomerOrderSummary[] = customersData.map(customer => {
        const customerOrders = ordersData.filter(order => order.customer_id === customer.id);
        const items = customerOrders.flatMap(order => 
          order.items.map(item => ({
            item: item.menu_item,
            quantity: item.quantity,
            price: item.price_at_time,
            status: item.status,
            customerName: customer.name
          }))
        );
        
        return {
          customer,
          orders: customerOrders,
          totalSpent: customerOrders.reduce((sum, order) => sum + order.total, 0),
          orderCount: customerOrders.length,
          items
        };
      });

      setCustomerOrderSummaries(summaries);

      // Calculate statistics
      const totalAmount = ordersData.reduce((sum, order) => sum + order.total, 0);
      const sessionDuration = calculateSessionDuration(sessionData.created_at);
      
      setStatistics({
        totalParticipants: customersData.length,
        totalOrders: ordersData.length,
        totalAmount,
        averageOrder: ordersData.length > 0 ? totalAmount / ordersData.length : 0,
        sessionDuration
      });

    } catch (err) {
      console.error('Error loading session data:', err);
      setError('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate session duration
  const calculateSessionDuration = (createdAt: Date): string => {
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Toggle customer expansion
  const toggleCustomerExpansion = (customerId: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSessionData();
    setRefreshing(false);
    onRefresh?.();
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
          return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount / 100); // Assuming amount is in cents
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      case 'order_received': return 'text-yellow-600 bg-yellow-50';
      case 'preparing': return 'text-orange-600 bg-orange-50';
      case 'prepared': return 'text-purple-600 bg-purple-50';
      case 'delivered': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Load data on mount
  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
          <span className="ml-3 text-gray-600">Loading session data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-gray-600">Session not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Session Overview Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Group Order Session</h2>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <span className="font-semibold">OTP:</span>
                <span className="ml-2 bg-white bg-opacity-20 px-3 py-1 rounded-lg font-mono text-lg">
                  {session.session_otp}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{statistics.sessionDuration}</span>
              </div>
              <div className="flex items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  session.status === 'active' ? 'bg-green-500' : 
                  session.status === 'billed' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {session.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg transition-colors flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {onRequestBill && (
              <button
                onClick={onRequestBill}
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors"
              >
                Request Bill
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Session Statistics */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{statistics.totalParticipants}</div>
            <div className="text-sm text-gray-600">Participants</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <ShoppingBag className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{statistics.totalOrders}</div>
            <div className="text-sm text-gray-600">Orders</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(statistics.totalAmount)}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(statistics.averageOrder)}</div>
            <div className="text-sm text-gray-600">Average</div>
          </div>
        </div>
      </div>

      {/* Customer Orders */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Orders</h3>
        
        {customerOrderSummaries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No orders placed yet
          </div>
        ) : (
          <div className="space-y-4">
            {customerOrderSummaries.map((summary) => {
              const isCurrentCustomer = summary.customer.id === currentCustomerId;
              const isExpanded = expandedCustomers.has(summary.customer.id);
              
              return (
                <div
                  key={summary.customer.id}
                  className={`border rounded-lg overflow-hidden ${
                    isCurrentCustomer ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {/* Customer Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleCustomerExpansion(summary.customer.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">
                              {summary.customer.name}
                              {isCurrentCustomer && (
                                <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                  You
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="h-3 w-3 mr-1" />
                            <span>{summary.customer.phone}</span>
                            <span className="mx-2">•</span>
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Joined {formatDate(summary.customer.joined_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(summary.totalSpent)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {summary.orderCount} order{summary.orderCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Order Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      {summary.items.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No items ordered yet
                        </div>
                      ) : (
                        <div className="p-4 space-y-3">
                          {summary.items.map((item, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {item.item.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Qty: {item.quantity} • {formatCurrency(item.price * item.quantity)}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                                    {item.status.replace('_', ' ').toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Management Actions */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-3">
          {onRegenerateOTP && (
            <button
              onClick={onRegenerateOTP}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate OTP
            </button>
          )}
          
          {onCloseSession && (
            <button
              onClick={onCloseSession}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
            >
              Close Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 