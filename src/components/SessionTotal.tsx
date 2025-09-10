"use client"
import React, { useMemo, useState, useCallback } from 'react';
import { Session, SessionCustomer, Order } from './types';
import { 
  DollarSign, 
  Receipt, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  FileText,
  Share2,
  Download,
  Printer,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Wallet,
  Split,
  Calculator,
  PieChart,
  BarChart3
} from 'lucide-react';
import { Modal, Select } from './ui';

interface SessionTotalProps {
  session: Session;
  participants: SessionCustomer[];
  orders: Order[];
  currentCustomer?: SessionCustomer | null;
  onRequestBill?: () => Promise<void>;
  onShareBill?: () => Promise<void>;
  onDownloadBill?: () => Promise<void>;
  onPrintBill?: () => Promise<void>;
  loading?: boolean;
}

interface BillItem {
  customerName: string;
  customerPhone: string;
  orderCount: number;
  totalSpent: number;
  orders: Order[];
  percentage: number;
}

interface BillSummary {
  totalAmount: number;
  totalOrders: number;
  totalParticipants: number;
  averageOrderValue: number;
  averagePerPerson: number;
  items: BillItem[];
}

interface SplitOption {
  id: string;
  name: string;
  description: string;
  calculateSplit: (total: number, participants: number) => number;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

export const SessionTotal: React.FC<SessionTotalProps> = ({
  session,
  participants,
  orders,
  currentCustomer,
  onRequestBill,
  onShareBill,
  onDownloadBill,
  onPrintBill,
  loading = false
}) => {
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [showSplitOptions, setShowSplitOptions] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSplitOption, setSelectedSplitOption] = useState<string>('equal');
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});

  // Bill splitting options
  const splitOptions: SplitOption[] = [
    {
      id: 'equal',
      name: 'Equal Split',
      description: 'Split the total equally among all participants',
      calculateSplit: (total, participants) => Math.ceil(total / participants)
    },
    {
      id: 'proportional',
      name: 'Proportional Split',
      description: 'Split based on what each person ordered',
      calculateSplit: (total, participants) => total // This will be calculated per person
    },
    {
      id: 'individual',
      name: 'Individual Bills',
      description: 'Each person pays for their own orders',
      calculateSplit: (total, participants) => total // This will be calculated per person
    },
    {
      id: 'custom',
      name: 'Custom Split',
      description: 'Manually set amounts for each person',
      calculateSplit: (total, participants) => total
    }
  ];

  // Payment methods
  const availablePaymentMethods: PaymentMethod[] = [
    {
      id: 'cash',
      name: 'Cash',
      icon: <Wallet className="w-4 h-4" />,
      color: 'text-green-600'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="w-4 h-4" />,
      color: 'text-blue-600'
    },
    {
      id: 'digital',
      name: 'Digital Wallet',
      icon: <Wallet className="w-4 h-4" />,
      color: 'text-purple-600'
    },
    {
      id: 'split',
      name: 'Split Payment',
      icon: <Split className="w-4 h-4" />,
      color: 'text-orange-600'
    }
  ];

  // Calculate bill summary
  const billSummary = useMemo((): BillSummary => {
    const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const totalParticipants = participants.length;
    const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;
    const averagePerPerson = totalParticipants > 0 ? totalAmount / totalParticipants : 0;

    // Group orders by customer
    const customerOrders = new Map<string, Order[]>();
    orders.forEach(order => {
      if (order.customer_id) {
        const existing = customerOrders.get(order.customer_id) || [];
        customerOrders.set(order.customer_id, [...existing, order]);
      }
    });

    // Create bill items
    const items: BillItem[] = participants.map(participant => {
      const participantOrders = customerOrders.get(participant.id) || [];
      const totalSpent = participantOrders.reduce((sum, order) => sum + order.total, 0);
      const percentage = totalAmount > 0 ? (totalSpent / totalAmount) * 100 : 0;

      return {
        customerName: participant.name,
        customerPhone: participant.phone,
        orderCount: participantOrders.length,
        totalSpent,
        orders: participantOrders,
        percentage
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);

    return {
      totalAmount,
      totalOrders,
      totalParticipants,
      averageOrderValue,
      averagePerPerson,
      items
    };
  }, [participants, orders]);

  // Calculate split amounts
  const splitAmounts = useMemo(() => {
    const selectedOption = splitOptions.find(option => option.id === selectedSplitOption);
    if (!selectedOption) return {};

    const amounts: Record<string, number> = {};

    if (selectedOption.id === 'equal') {
      const equalAmount = Math.ceil(billSummary.totalAmount / billSummary.totalParticipants);
      participants.forEach(participant => {
        amounts[participant.id] = equalAmount;
      });
    } else if (selectedOption.id === 'proportional' || selectedOption.id === 'individual') {
      billSummary.items.forEach(item => {
        const participant = participants.find(p => p.phone === item.customerPhone);
        if (participant) {
          amounts[participant.id] = item.totalSpent;
        }
      });
    }

    return amounts;
  }, [selectedSplitOption, billSummary, participants]);

  // Handle bill request
  const handleRequestBill = useCallback(async () => {
    if (onRequestBill) {
      setActionLoading('request');
      try {
        await onRequestBill();
        setShowBillPreview(true);
      } catch (error) {
        console.error('Error requesting bill:', error);
      } finally {
        setActionLoading(null);
      }
    } else {
      setShowBillPreview(true);
    }
  }, [onRequestBill]);

  // Handle share bill
  const handleShareBill = useCallback(async () => {
    if (onShareBill) {
      setActionLoading('share');
      try {
        await onShareBill();
      } catch (error) {
        console.error('Error sharing bill:', error);
      } finally {
        setActionLoading(null);
      }
    }
  }, [onShareBill]);

  // Handle download bill
  const handleDownloadBill = useCallback(async () => {
    if (onDownloadBill) {
      setActionLoading('download');
      try {
        await onDownloadBill();
      } catch (error) {
        console.error('Error downloading bill:', error);
      } finally {
        setActionLoading(null);
      }
    }
  }, [onDownloadBill]);

  // Handle print bill
  const handlePrintBill = useCallback(async () => {
    if (onPrintBill) {
      setActionLoading('print');
      try {
        await onPrintBill();
      } catch (error) {
        console.error('Error printing bill:', error);
      } finally {
        setActionLoading(null);
      }
    }
  }, [onPrintBill]);

  // Get session status indicator
  const getStatusIndicator = () => {
    switch (session.status) {
      case 'active':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Active</span>
          </div>
        );
      case 'billed':
        return (
          <div className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Billed</span>
          </div>
        );
      case 'cleared':
        return (
          <div className="flex items-center gap-2 text-gray-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Closed</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
          return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Session Total</h3>
              <p className="text-sm text-gray-600">Financial summary and billing</p>
            </div>
          </div>
          {getStatusIndicator()}
        </div>

        {/* Total Amount Display */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Session Amount</p>
            <div className="text-4xl font-bold text-green-600 mb-2">
              {formatCurrency(billSummary.totalAmount)}
            </div>
            <p className="text-sm text-gray-600">
              {billSummary.totalOrders} order{billSummary.totalOrders !== 1 ? 's' : ''} • {billSummary.totalParticipants} participant{billSummary.totalParticipants !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Participants</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{billSummary.totalParticipants}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Total Orders</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{billSummary.totalOrders}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Avg Order</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(billSummary.averageOrderValue)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">Per Person</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(billSummary.averagePerPerson)}
            </p>
          </div>
        </div>

        {/* Individual Breakdown */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Individual Breakdown</h4>
          <div className="space-y-3">
            {billSummary.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{item.customerName}</span>
                    {currentCustomer?.phone === item.customerPhone && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {item.orderCount} order{item.orderCount !== 1 ? 's' : ''} • {item.customerPhone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(item.totalSpent)}</p>
                  <p className="text-xs text-gray-600">{item.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRequestBill}
            disabled={loading || actionLoading === 'request' || session.status !== 'active'}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Receipt className="w-4 h-4" />
            <span>Request Bill</span>
          </button>

          <button
            onClick={() => setShowSplitOptions(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Split className="w-4 h-4" />
            <span>Split Bill</span>
          </button>

          <button
            onClick={() => setShowPaymentMethods(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span>Payment Methods</span>
          </button>

          {session.status === 'billed' && (
            <>
              <button
                onClick={handleShareBill}
                disabled={loading || actionLoading === 'share'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Bill</span>
              </button>

              <button
                onClick={handleDownloadBill}
                disabled={loading || actionLoading === 'download'}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>

              <button
                onClick={handlePrintBill}
                disabled={loading || actionLoading === 'print'}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bill Preview Modal */}
      <Modal
        isOpen={showBillPreview}
        onClose={() => setShowBillPreview(false)}
        title="Bill Preview"
        maxWidth="lg"
        showFooter={true}
        actionText="Generate Bill"
        onAction={handleRequestBill}
        actionLoading={actionLoading === 'request'}
      >
        <div className="space-y-6">
          {/* Bill Header */}
          <div className="text-center border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Session Bill</h2>
            <p className="text-gray-600">Table {session.restaurant_tables?.table_number || session.table_id.slice(0, 8)} • Session {session.session_otp}</p>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
            </p>
          </div>

          {/* Bill Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(billSummary.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Participants</p>
                <p className="text-2xl font-bold text-gray-900">{billSummary.totalParticipants}</p>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Detailed Breakdown</h3>
            <div className="space-y-3">
              {billSummary.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.customerName}</p>
                    <p className="text-sm text-gray-600">
                      {item.orderCount} order{item.orderCount !== 1 ? 's' : ''} • {item.customerPhone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(item.totalSpent)}</p>
                    <p className="text-sm text-gray-600">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Details</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {orders.map((order, index) => (
                <div key={order.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {order.customer_name || 'Unknown Customer'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Split Options Modal */}
      <Modal
        isOpen={showSplitOptions}
        onClose={() => setShowSplitOptions(false)}
        title="Split Bill Options"
        maxWidth="lg"
        showFooter={false}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split Method
            </label>
            <Select
              value={selectedSplitOption}
              onChange={(value) => setSelectedSplitOption(value)}
              options={splitOptions.map(option => ({
                value: option.id,
                label: option.name
              }))}
            />
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Split Breakdown</h4>
            <div className="space-y-3">
              {participants.map((participant) => {
                const amount = splitAmounts[participant.id] || 0;
                const isCurrentUser = currentCustomer?.id === participant.id;
                
                return (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{participant.name}</span>
                      {isCurrentUser && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(amount)}</p>
                      <p className="text-xs text-gray-600">
                        {billSummary.totalAmount > 0 ? ((amount / billSummary.totalAmount) * 100).toFixed(1) : '0'}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Total</span>
              <span className="font-bold text-gray-900">{formatCurrency(billSummary.totalAmount)}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Payment Methods Modal */}
      <Modal
        isOpen={showPaymentMethods}
        onClose={() => setShowPaymentMethods(false)}
        title="Payment Methods"
        maxWidth="md"
        showFooter={false}
      >
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Select Payment Methods</h4>
            <div className="space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{participant.name}</p>
                    <p className="text-sm text-gray-600">{participant.phone}</p>
                  </div>
                  <Select
                    value={paymentMethods[participant.id] || ''}
                    onChange={(value) => setPaymentMethods(prev => ({
                      ...prev,
                      [participant.id]: value
                    }))}
                    options={[
                      { value: '', label: 'Select method' },
                      ...availablePaymentMethods.map(method => ({
                        value: method.id,
                        label: method.name
                      }))
                    ]}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Payment Summary</h4>
            <div className="space-y-2">
              {availablePaymentMethods.map((method) => {
                const count = Object.values(paymentMethods).filter(m => m === method.id).length;
                if (count === 0) return null;
                
                return (
                  <div key={method.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={method.color}>{method.icon}</span>
                      <span className="text-sm text-gray-700">{method.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count} people</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}; 