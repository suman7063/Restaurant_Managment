import React, { useState, useEffect } from 'react';
import { X, Users, Clock, DollarSign, Phone, Calendar, RefreshCw, XCircle, Copy, Eye, ShoppingCart, Activity, User, Package, CheckCircle } from 'lucide-react';
import { Session, SessionCustomer, Order } from '../types';

interface SessionDetailsModalProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
  onRegenerateOTP: (sessionId: string) => void;
  onCloseSession: (sessionId: string) => void;
}

const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  session,
  isOpen,
  onClose,
  onRegenerateOTP,
  onCloseSession
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'orders' | 'timeline'>('overview');
  const [details, setDetails] = useState({
    customers: [] as SessionCustomer[],
    orders: [] as Order[],
    totalCustomers: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    sessionDuration: '0m'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && session) {
      loadSessionDetails();
    }
  }, [isOpen, session]);

  const loadSessionDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/sessions/${session.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDetails({
            customers: data.data.customers,
            orders: data.data.orders,
            totalCustomers: data.data.totalCustomers,
            totalOrders: data.data.totalOrders,
            averageOrderValue: data.data.averageOrderValue,
            sessionDuration: data.data.sessionDuration
          });
        } else {
          console.error('Failed to load session details:', data.message);
        }
      } else {
        console.error('Failed to load session details');
      }
    } catch (error) {
      console.error('Error loading session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'billed': return 'bg-blue-100 text-blue-800';
      case 'cleared': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Session Details</h2>
              <p className="text-gray-600">OTP: {session.session_otp} • Table: {session.restaurant_tables?.table_number ? `Table ${session.restaurant_tables.table_number}` : `Table ${session.table_id.slice(0, 8)}...`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'participants', label: 'Participants', icon: Users },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'timeline', label: 'Timeline', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'participants' | 'orders' | 'timeline')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Session Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-600">Participants</p>
                          <p className="text-2xl font-bold text-blue-900">{details.totalCustomers}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <ShoppingCart className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-green-600">Orders</p>
                          <p className="text-2xl font-bold text-green-900">{details.totalOrders}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-purple-600">Avg Order</p>
                          <p className="text-2xl font-bold text-purple-900">
                            ₹{details.averageOrderValue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-orange-600">Duration</p>
                          <p className="text-2xl font-bold text-orange-900">{details.sessionDuration}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Session Info */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-semibold text-green-600">
                            ₹{session.total_amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Created:</span>
                          <span className="text-gray-900">
                            {formatDate(session.created_at)} at {formatTime(session.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">OTP:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-blue-600">{session.session_otp}</span>
                            <button
                              onClick={() => copyToClipboard(session.session_otp)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Table:</span>
                          <span className="font-semibold text-gray-900">
                            {session.restaurant_tables?.table_number ? `Table ${session.restaurant_tables.table_number}` : `Table ${session.table_id.slice(0, 8)}...`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Last Updated:</span>
                          <span className="text-gray-900">
                            {formatDate(session.updated_at)} at {formatTime(session.updated_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {session.status === 'active' && (
                    <div className="bg-blue-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => onRegenerateOTP(session.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Regenerate OTP
                        </button>
                        <button
                          onClick={() => onCloseSession(session.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-300 flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Close Session
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Participants Tab */}
              {activeTab === 'participants' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Participants ({details.totalCustomers})
                  </h3>
                  {details.customers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No participants have joined this session yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {details.customers.map((customer) => (
                        <div key={customer.id} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{customer.name}</p>
                                <p className="text-sm text-gray-600">{customer.phone}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Joined</p>
                              <p className="text-sm font-medium text-gray-900">
                                {formatTime(customer.joined_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Orders ({details.totalOrders})
                  </h3>
                  {details.orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No orders have been placed in this session yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {details.orders.map((order) => (
                                                    <div key={order.id} className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-green-100 p-2 rounded-lg">
                                    <Package className="w-5 h-5 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">Order #{order.id.slice(-6)}</p>
                                    <p className="text-sm text-gray-600">{order.customer_name}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-600">
                                    ₹{order.total.toFixed(2)}
                                  </p>
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {order.status}
                                  </span>
                                </div>
                              </div>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-600">×{item.quantity}</span>
                                  <span className="font-medium">{item.menu_item.name}</span>
                                </div>
                                <span className="text-gray-900">
                                  ₹{(item.price_at_time * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                            Placed at {formatTime(order.timestamp)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Session Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Session Created</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(session.created_at)} at {formatTime(session.created_at)}
                        </p>
                        <p className="text-sm text-gray-500">OTP: {session.session_otp}</p>
                      </div>
                    </div>

                    {details.customers.map((customer) => (
                      <div key={customer.id} className="flex items-start space-x-4">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Users className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{customer.name} joined</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(customer.joined_at)} at {formatTime(customer.joined_at)}
                          </p>
                          <p className="text-sm text-gray-500">Phone: {customer.phone}</p>
                        </div>
                      </div>
                    ))}

                    {details.orders.map((order) => (
                      <div key={order.id} className="flex items-start space-x-4">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <ShoppingCart className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Order placed by {order.customer_name}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.timestamp)} at {formatTime(order.timestamp)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Total: ₹{order.total.toFixed(2)} • {order.items.length} items
                          </p>
                        </div>
                      </div>
                    ))}

                    {session.status !== 'active' && (
                      <div className="flex items-start space-x-4">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <XCircle className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Session {session.status}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(session.updated_at)} at {formatTime(session.updated_at)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDetailsModal; 