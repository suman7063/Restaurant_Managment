"use client"
import React, { useMemo, useState, useCallback } from 'react';
import { SessionCustomer, Order } from './types';
import { 
  User, 
  Phone, 
  Clock, 
  ShoppingBag, 
  DollarSign, 
  Crown,
  Calendar,
  Trash2,
  Eye,
  Activity,
  MoreVertical,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Modal } from './ui';

interface ParticipantsListProps {
  participants: SessionCustomer[];
  orders: Order[];
  currentCustomer?: SessionCustomer | null;
  loading?: boolean;
  isAdmin?: boolean;
  onRemoveParticipant?: (participantId: string) => Promise<void>;
}

interface ParticipantStats {
  customer: SessionCustomer;
  orderCount: number;
  totalSpent: number;
  orders: Order[];
  isCurrentUser: boolean;
  isActive: boolean;
  lastActivity: Date;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  orders,
  currentCustomer,
  loading = false,
  isAdmin = false,
  onRemoveParticipant
}) => {
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantStats | null>(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Calculate participant statistics
  const participantStats = useMemo((): ParticipantStats[] => {
    return participants.map(participant => {
      const participantOrders = orders.filter(order => 
        order.customer_id === participant.id
      );
      
      const totalSpent = participantOrders.reduce((sum, order) => sum + order.total, 0);
      const orderCount = participantOrders.length;
      
      // Calculate activity status (active if last order was within 30 minutes)
      const lastOrder = participantOrders.length > 0 
        ? participantOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        : null;
      
      const lastActivity = lastOrder ? new Date(lastOrder.timestamp) : new Date(participant.joined_at);
      const isActive = Boolean(lastOrder && (Date.now() - lastActivity.getTime()) < 30 * 60 * 1000); // 30 minutes
      
      return {
        customer: participant,
        orderCount,
        totalSpent,
        orders: participantOrders,
        isCurrentUser: currentCustomer?.id === participant.id,
        isActive,
        lastActivity
      };
    }).sort((a, b) => {
      // Sort by total spent (descending), then by join time (ascending)
      if (b.totalSpent !== a.totalSpent) {
        return b.totalSpent - a.totalSpent;
      }
      return new Date(a.customer.joined_at).getTime() - new Date(b.customer.joined_at).getTime();
    });
  }, [participants, orders, currentCustomer]);

  // Handle remove participant
  const handleRemoveParticipant = useCallback(async (participantId: string) => {
    if (onRemoveParticipant) {
      setActionLoading(participantId);
      try {
        await onRemoveParticipant(participantId);
        setShowRemoveConfirm(null);
      } catch (error) {
        console.error('Error removing participant:', error);
      } finally {
        setActionLoading(null);
      }
    }
  }, [onRemoveParticipant]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  // Format time ago
  const formatTimeAgo = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else {
      return 'Just now';
    }
  };

  // Get top spender
  const topSpender = participantStats.length > 0 ? participantStats[0] : null;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
            <p className="text-sm text-gray-600">Session members and their orders</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-100 h-20 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
            <p className="text-sm text-gray-600">
              {participants.length} member{participants.length !== 1 ? 's' : ''} in session
            </p>
          </div>
        </div>

        {/* Participants List */}
        <div className="space-y-4">
          {participantStats.map((stats, index) => (
            <div
              key={stats.customer.id}
              className={`p-4 rounded-lg border transition-all ${
                stats.isCurrentUser
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                {/* Participant Info */}
                <div className="flex items-start gap-3 flex-1">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center relative ${
                    stats.isCurrentUser ? 'bg-blue-500' : 'bg-gray-400'
                  }`}>
                    <User className="w-6 h-6 text-white" />
                    {/* Activity indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      stats.isActive ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      {stats.isActive && <Activity className="w-2 h-2 text-white" />}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {stats.customer.name}
                      </h4>
                      {stats.isCurrentUser && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          You
                        </span>
                      )}
                      {topSpender && stats.customer.id === topSpender.customer.id && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Crown className="w-4 h-4" />
                          <span className="text-xs font-medium">Top Spender</span>
                        </div>
                      )}
                      {stats.isActive && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span className="text-xs font-medium">Active</span>
                        </div>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{stats.customer.phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Joined {formatTimeAgo(stats.customer.joined_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Last active: {formatTimeAgo(stats.lastActivity)}</span>
                      </div>
                    </div>

                    {/* Order Statistics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{stats.orderCount}</p>
                          <p className="text-xs text-gray-600">Orders</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(stats.totalSpent)}
                          </p>
                          <p className="text-xs text-gray-600">Total Spent</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedParticipant(stats);
                      setShowOrderHistory(true);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Order History"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {isAdmin && !stats.isCurrentUser && (
                    <button
                      onClick={() => setShowRemoveConfirm(stats.customer.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Participant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Recent Orders Preview */}
              {stats.orders.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Recent Orders:</p>
                  <div className="space-y-1">
                    {stats.orders.slice(0, 3).map(order => (
                      <div key={order.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 truncate">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-gray-600 font-medium">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    ))}
                    {stats.orders.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{stats.orders.length - 3} more order{stats.orders.length - 3 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {participants.length === 0 && (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No participants yet</p>
            <p className="text-sm text-gray-500">Share the session code to invite others</p>
          </div>
        )}

        {/* Summary Stats */}
        {participants.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{participants.length}</p>
                <p className="text-sm text-gray-600">Total Members</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.length}
                </p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}
                </p>
                <p className="text-sm text-gray-600">Total Spent</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order History Modal */}
      <Modal
        isOpen={showOrderHistory}
        onClose={() => setShowOrderHistory(false)}
        title={`Order History - ${selectedParticipant?.customer.name}`}
        maxWidth="lg"
        showFooter={false}
      >
        {selectedParticipant && (
          <div className="space-y-4">
            {/* Participant Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedParticipant.isCurrentUser ? 'bg-blue-500' : 'bg-gray-400'
                }`}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedParticipant.customer.name}</h3>
                  <p className="text-sm text-gray-600">{selectedParticipant.customer.phone}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(selectedParticipant.totalSpent)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedParticipant.orderCount} order{selectedParticipant.orderCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Orders List */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Order Details</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedParticipant.orders.length > 0 ? (
                  selectedParticipant.orders.map((order, index) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            Order #{index + 1}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.timestamp)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(order.total)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      {/* Order Items */}
                      <div className="space-y-2">
                        {order.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center justify-between text-sm">
                            <div className="flex-1">
                              <p className="text-gray-900">{item.menu_item.name}</p>
                              <p className="text-gray-600">
                                Qty: {item.quantity} • ${(item.price_at_time / 100).toFixed(2)}
                              </p>
                            </div>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(item.price_at_time * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No orders yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Remove Participant Confirmation Modal */}
      <Modal
        isOpen={showRemoveConfirm !== null}
        onClose={() => setShowRemoveConfirm(null)}
        title="Remove Participant"
        maxWidth="sm"
        showFooter={true}
        actionText="Remove"
        onAction={() => showRemoveConfirm && handleRemoveParticipant(showRemoveConfirm)}
        actionLoading={actionLoading === showRemoveConfirm}
        actionVariant="danger"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Participant</h3>
            <p className="text-gray-600">
              Are you sure you want to remove this participant from the session? 
              This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}; 