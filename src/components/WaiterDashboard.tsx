import React, { useState, useEffect } from 'react';
import { UserCheck, Users, ShoppingCart, Bell, CheckCircle, Clock, TrendingUp, Coffee, Globe, Search, Filter, RefreshCw } from 'lucide-react';
import { User, Order, Table, Session, SessionCustomer } from './types';
import { formatCurrency, getOrderStatusColor, getTableStatusColor } from './utils';
import SessionOrderCard from './SessionOrderCard';

interface WaiterDashboardProps {
  currentUser: User;
  setCurrentUser: (user: User | null) => void;
  orders: Order[];
  tables: Table[];
  onUpdateOrderStatus: (orderId: string, newStatus: string) => void;
}

interface SessionData {
  session: Session;
  orders: Order[];
  customers: SessionCustomer[];
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
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'billed' | 'cleared'>('all');
  const [viewMode, setViewMode] = useState<'sessions' | 'tables'>('sessions');

  const myTables = tables.filter(table => table.waiter_name === currentUser.name);
  const myOrders = orders.filter(order => order.waiter_name === currentUser.name && order.status !== 'completed');

  // Load sessions data
  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [currentUser.restaurant_id]);

  const loadSessions = async () => {
    if (!currentUser.restaurant_id) return;
    
    try {
      setSessionsLoading(true);
      const response = await fetch(`/api/waiter/sessions?restaurantId=${currentUser.restaurant_id}`);
      
      if (response.ok) {
        const data = await response.json();
        setSessions(data.data.sessions || []);
      } else {
        console.error('Failed to load sessions');
        // Load mock data for development
        loadMockSessions();
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      loadMockSessions();
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadMockSessions = () => {
    const mockSessions: SessionData[] = [
      {
        session: {
          id: 'mock-session-1',
          table_id: 'mock-table-1',
          restaurant_id: currentUser.restaurant_id || 'mock-restaurant',
          session_otp: '123456',
          status: 'active',
          total_amount: 4500,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
          updated_at: new Date()
        },
        orders: [
          {
            id: 'order-1',
            table: 1,
            customer_name: 'John Doe',
            customer_phone: '+1234567890',
            items: [
              {
                id: 'item-1',
                order_id: 'order-1',
                menu_item: {
                  id: 'menu-1',
                  name: 'Margherita Pizza',
                  price: 15.99,
                  description: 'Classic tomato and mozzarella',
                  category_id: 'cat-1',
                  prepTime: 20,
                  rating: 4.5,
                  image: '/pizza.jpg',
                  available: true,
                  kitchen_stations: ['pizza-station'],
                  is_veg: true,
                  cuisine_type: 'Italian'
                },
                quantity: 2,
                special_notes: 'Extra cheese please',
                status: 'order_received',
                kitchen_station: 'pizza-station',
                price_at_time: 15.99,
                selected_add_ons: []
              }
            ],
            status: 'active',
            timestamp: new Date(),
            total: 31.98,
            estimated_time: 25,
            is_joined_order: false,
            is_session_order: true,
            session_id: 'mock-session-1',
            customer_id: 'customer-1'
          }
        ],
        customers: [
          {
            id: 'customer-1',
            session_id: 'mock-session-1',
            name: 'John Doe',
            phone: '+1234567890',
            joined_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
          }
        ]
      },
      {
        session: {
          id: 'mock-session-2',
          table_id: 'mock-table-2',
          restaurant_id: currentUser.restaurant_id || 'mock-restaurant',
          session_otp: '789012',
          status: 'billed',
          total_amount: 3200,
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000),
          updated_at: new Date()
        },
        orders: [],
        customers: []
      }
    ];
    setSessions(mockSessions);
  };

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

  const handleOrderStatusUpdate = async (orderId: string, itemId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          itemStatus: newStatus
        })
      });

      if (response.ok) {
        // Refresh sessions to get updated data
        loadSessions();
      } else {
        console.error('Failed to update order item status');
      }
    } catch (error) {
      console.error('Error updating order item status:', error);
    }
  };

  const handleSessionAction = async (sessionId: string, action: 'view' | 'bill' | 'close') => {
    try {
      switch (action) {
        case 'bill':
          const billResponse = await fetch(`/api/sessions/${sessionId}/close`, {
            method: 'POST'
          });
          if (billResponse.ok) {
            loadSessions();
          }
          break;
        case 'close':
          const closeResponse = await fetch(`/api/sessions/${sessionId}/close`, {
            method: 'POST'
          });
          if (closeResponse.ok) {
            loadSessions();
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error performing session action:', error);
    }
  };

  const toggleSessionExpanded = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const filteredSessions = sessions.filter(sessionData => {
    const matchesSearch = searchTerm === '' || 
      sessionData.session.session_otp.includes(searchTerm) ||
      sessionData.customers.some(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || sessionData.session.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sessionStats = {
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => s.session.status === 'active').length,
    totalRevenue: sessions.reduce((sum, s) => sum + s.session.total_amount, 0),
    totalOrders: sessions.reduce((sum, s) => sum + s.orders.length, 0)
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
                  <span>{sessionStats.activeSessions} Active Sessions</span>
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
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode('sessions')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  viewMode === 'sessions'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Sessions
              </button>
              <button
                onClick={() => setViewMode('tables')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  viewMode === 'tables'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Coffee className="w-4 h-4 inline mr-2" />
                Tables
              </button>
            </div>
            <button
              onClick={loadSessions}
              disabled={sessionsLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${sessionsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {viewMode === 'sessions' ? (
            /* Sessions View */
            <div className="space-y-6">
              {/* Session Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Sessions</p>
                      <p className="text-3xl font-bold text-gray-900">{sessionStats.totalSessions}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Active Sessions</p>
                      <p className="text-3xl font-bold text-gray-900">{sessionStats.activeSessions}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-xl">
                      <ShoppingCart className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                      <p className="text-3xl font-bold text-gray-900">{sessionStats.totalOrders}</p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-xl">
                      <ShoppingCart className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Session Revenue</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(sessionStats.totalRevenue / 100)}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by OTP or customer name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="billed">Billed</option>
                      <option value="cleared">Cleared</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sessions List */}
              <div className="space-y-6">
                {sessionsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading sessions...</p>
                  </div>
                ) : filteredSessions.length > 0 ? (
                  filteredSessions.map((sessionData) => (
                    <SessionOrderCard
                      key={sessionData.session.id}
                      session={sessionData.session}
                      orders={sessionData.orders}
                      customers={sessionData.customers}
                      onOrderStatusUpdate={handleOrderStatusUpdate}
                      onSessionAction={handleSessionAction}
                      isExpanded={expandedSessions.has(sessionData.session.id)}
                      onToggleExpanded={toggleSessionExpanded}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
                    <div className="text-6xl mb-4">🍽️</div>
                    <p className="text-gray-500 text-lg font-semibold">No sessions found</p>
                    <p className="text-gray-400 text-sm mt-2">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria'
                        : 'No active sessions at the moment'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tables View - Original waiter dashboard content */
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
          )}

          {viewMode === 'tables' && (
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
          )}
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