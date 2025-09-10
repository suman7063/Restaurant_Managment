"use client"
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CustomerInterface from '../../../components/CustomerInterface';
import { User, CartItem, MenuItem, MenuCustomization, MenuAddOn, Session, SessionCustomer, Order } from '../../../components/types';
import { SessionChoiceModal } from '../../../components/SessionChoiceModal';
import { OTPDisplayModal } from '../../../components/OTPDisplayModal';
import { CustomerRegistrationModal } from '../../../components/CustomerRegistrationModal';
import { menuService } from '../../../lib/database';
import { formatCurrency } from '../../../components/utils';

interface TableInfo {
  id: string;
  table_number: number;
  restaurant_id: string;
  restaurant?: {
    name: string;
  };
  waiter_id?: string;
  waiter_name?: string;
}

const TablePage: React.FC = () => {
  const params = useParams();
  const qrCode = params.qrCode as string;
  
  // Hydration fix
  const [mounted, setMounted] = useState(false);
  
  // Core state - initialize with null to prevent hydration issues
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string>('');
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);

  // Session management state
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionCustomers, setSessionCustomers] = useState<SessionCustomer[]>([]);
  const [sessionOrders, setSessionOrders] = useState<Order[]>([]);
  
  // Debug logging for sessionCustomers
  useEffect(() => {
    console.log('sessionCustomers type:', typeof sessionCustomers, 'value:', sessionCustomers, 'isArray:', Array.isArray(sessionCustomers));
  }, [sessionCustomers]);


  const [showSessionChoice, setShowSessionChoice] = useState(false);
  const [showOTPDisplay, setShowOTPDisplay] = useState(false);
  const [showCustomerRegistration, setShowCustomerRegistration] = useState(false);
  const [showOTPEntry, setShowOTPEntry] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string>('');
  const [pendingCustomerData, setPendingCustomerData] = useState<{ name: string; phone: string } | null>(null);
  const [sessionAction, setSessionAction] = useState<'create' | 'join' | null>(null);

  // Set mounted state on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize customer session
  useEffect(() => {
    if (!mounted) return;
    
    const initializeCustomer = () => {
      // Create a temporary customer user for this session
      // Use a simple counter to avoid hydration issues
      const sessionId = `temp-customer-session`;
      
      const customer: User = {
        id: sessionId,
        name: 'Guest Customer',
        email: `guest@restaurant.com`,
        phone: '',
        role: 'customer',
        restaurant_id: '', // Will be set when we fetch table info
        created_at: '2024-01-01T00:00:00.000Z', // Static date to prevent hydration issues
        updated_at: '2024-01-01T00:00:00.000Z',
        deleted_at: null,
        preferred_language: 'en'
      };
      setCurrentUser(customer);
    };

    initializeCustomer();
  }, [mounted]);

  // Fetch table information and validate QR code
  useEffect(() => {
    if (!mounted) return;
    
    const fetchTableInfo = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch table information using the QR code
        const response = await fetch(`/api/table/${qrCode}`);
        if (!response.ok) {
          throw new Error('Invalid QR code or table not found');
        }

        const data = await response.json();
        setTableInfo(data.table);

        // Update customer with restaurant ID
        if (currentUser) {
          setCurrentUser(prev => prev ? { ...prev, restaurant_id: data.table.restaurant_id } : null);
        }

        // Check for active session after table info is loaded
        await checkActiveSession(data.table.id);

      } catch (err) {
        console.error('Error fetching table info:', err);
        setError('Invalid QR code or table not found. Please check the QR code and try again.');
      } finally {
        setLoading(false);
      }
    };

    if (qrCode) {
      fetchTableInfo();
    }
  }, [qrCode, mounted]); // Include mounted dependency

  // Update customer restaurant ID when table info is available
  useEffect(() => {
    if (tableInfo && currentUser && !currentUser.restaurant_id) {
      setCurrentUser(prev => prev ? { ...prev, restaurant_id: tableInfo.restaurant_id } : null);
    }
  }, [tableInfo, currentUser]);

  // Check for active session
  const checkActiveSession = async (tableId: string) => {
    try {
      setSessionLoading(true);
      setSessionError('');

      const response = await fetch(`/api/sessions/active?tableId=${tableId}`);
      const result = await response.json();

      if (result.success) {
        // Active session found - show session choice modal
        setCurrentSession(result.data);
        setShowSessionChoice(true);
      } else if (response.status === 404) {
        // No active session - show session choice modal to create new one
        setShowSessionChoice(true);
      } else {
        throw new Error(result.message || 'Failed to check session status');
      }
    } catch (error: any) {
      console.error('Error checking active session:', error);
      setSessionError(error.message || 'Failed to check session status');
      // Don't show error modal for session check failures, just log them
    } finally {
      setSessionLoading(false);
    }
  };

  // Fetch session data (customers and orders)
  const fetchSessionData = async (sessionId: string) => {
    try {
      setSessionLoading(true);
      
      // Fetch customers and orders in parallel
      const [customersResponse, ordersResponse] = await Promise.all([
        fetch(`/api/sessions/${sessionId}/customers`),
        fetch(`/api/sessions/${sessionId}/orders`)
      ]);

      if (customersResponse.ok) {
        const customersResult = await customersResponse.json();
        setSessionCustomers(customersResult.data || []);
      }

      if (ordersResponse.ok) {
        const ordersResult = await ordersResponse.json();
        setSessionOrders(ordersResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
    } finally {
      setSessionLoading(false);
    }
  };

  // Handle exit session
  const handleExitSession = async () => {
    try {
      // Clear session data
      setCurrentSession(null);
      setSessionCustomers([]);
      setSessionOrders([]);
      setShowSessionChoice(false);
      setShowOTPDisplay(false);
      setShowCustomerRegistration(false);
      setShowOTPEntry(false);
      setPendingCustomerData(null);
      setSessionAction(null);
      
      // Show session choice modal to allow creating/joining new session
      setShowSessionChoice(true);
    } catch (error) {
      console.error('Error exiting session:', error);
    }
  };

  // Handle session creation
  const handleCreateSession = async (customerData: { name: string; phone: string }) => {
    if (!tableInfo) return;

    try {
      setSessionLoading(true);
      setSessionError('');

      // Create session
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId: tableInfo.id,
          restaurantId: tableInfo.restaurant_id
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create session');
      }

      // Update current user with customer data
      setCurrentUser(prev => prev ? {
        ...prev,
        name: customerData.name,
        phone: customerData.phone,
        email: `${customerData.phone}@restaurant.com`
      } : null);

      // Set current session
      const session: Session = {
        id: result.data.sessionId,
        table_id: result.data.tableId,
        restaurant_id: result.data.restaurantId,
        session_otp: result.data.otp,
        status: result.data.status,
        total_amount: result.data.totalAmount,
        created_at: new Date(result.data.createdAt),
        updated_at: new Date(result.data.createdAt)
      };
      setCurrentSession(session);

      // Fetch session data
      await fetchSessionData(session.id);

      // Close session choice modal and show OTP display modal
      setShowSessionChoice(false);
      setShowOTPDisplay(true);

    } catch (error: any) {
      console.error('Error creating session:', error);
      setSessionError(error.message || 'Failed to create session');
      throw error;
    } finally {
      setSessionLoading(false);
    }
  };

  // Handle session joining
  const handleJoinSession = async (otp: string, customerData: { name: string; phone: string }): Promise<boolean> => {
    if (!tableInfo) return false;

    try {
      setSessionLoading(true);
      setSessionError('');

      // Join session
      const response = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp,
          tableId: tableInfo.id,
          customerName: customerData.name,
          customerPhone: customerData.phone
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to join session');
      }

      // Update current user with customer data
      setCurrentUser(prev => prev ? {
        ...prev,
        name: customerData.name,
        phone: customerData.phone,
        email: `${customerData.phone}@restaurant.com`
      } : null);

      // Set current session
      const session: Session = {
        id: result.data.sessionId,
        table_id: result.data.tableId,
        restaurant_id: result.data.restaurantId,
        session_otp: otp,
        status: result.data.status,
        total_amount: result.data.totalAmount,
        created_at: new Date(),
        updated_at: new Date()
      };
      setCurrentSession(session);

      // Add customer to session customers
      const customer: SessionCustomer = {
        id: result.data.customer.id,
        session_id: result.data.sessionId,
        name: result.data.customer.name,
        phone: result.data.customer.phone,
        joined_at: new Date(result.data.customer.joinedAt)
      };
      setSessionCustomers(prev => [...prev, customer]);

      // Fetch complete session data
      await fetchSessionData(session.id);
      
      // Close session choice modal
      setShowSessionChoice(false);
      
      return true;

    } catch (error: any) {
      console.error('Error joining session:', error);
      setSessionError(error.message || 'Failed to join session');
      return false;
    } finally {
      setSessionLoading(false);
    }
  };

  // Handle OTP regeneration (customer can't regenerate OTP - admin only)
  const handleRegenerateOTP = async () => {
    // This functionality is admin-only, so we'll show a message instead
    alert('OTP regeneration is only available to restaurant staff. Please ask a waiter for assistance.');
  };

  // Handle session closure (customer can't close session - admin only)
  const handleCloseSession = async () => {
    // This functionality is admin-only, so we'll show a message instead
    alert('Session closure is only available to restaurant staff. Please ask a waiter to close the session.');
  };

  // Handle start ordering
  const handleStartOrdering = () => {
    setShowOTPDisplay(false);
    // Continue with normal ordering flow
  };

  // Cart management functions
  const onAddToCart = (item: MenuItem, customization?: MenuCustomization | null, addOns?: MenuAddOn[], specialNotes?: string) => {
    const existingItemIndex = cart.findIndex(cartItem => 
      cartItem.id === item.id && 
      cartItem.selected_customization?.id === customization?.id &&
      cartItem.special_notes === specialNotes
    );

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      // Add new item to cart
      const newCartItem: CartItem = {
        ...item,
        quantity: 1,
        selected_customization: customization || undefined,
        selected_add_ons: addOns || [],
        special_notes: specialNotes || ''
      };
      setCart([...cart, newCartItem]);
    }
  };

  const onUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const onPlaceOrder = async () => {
    if (!currentUser || !tableInfo || cart.length === 0) return;

    try {
      // Create order with session data if available
      const orderData = {
        tableNumber: tableInfo.table_number,
        customerName: currentUser.name,
        items: cart,
        waiterId: tableInfo.waiter_id || null,
        sessionId: currentSession?.id || null, // Include session ID if available
        isGroupOrder: !!currentSession // Mark as group order if session exists
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      // Clear cart after successful order
      setCart([]);
      alert('Order placed successfully! A waiter will be with you shortly.');

    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid QR Code</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Please check the QR code and try again, or ask a staff member for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser || !tableInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Table {tableInfo.table_number}</h1>
              <p className="text-sm text-gray-600">Welcome to {tableInfo.restaurant?.name || 'Our Restaurant'}</p>
              {currentSession && (
                <p className="text-xs text-blue-600 font-medium">
                  Group Session Active • {sessionCustomers.length + 1} participants
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className="hidden sm:block text-right">
                <p className="text-xs text-gray-500">QR: {qrCode.slice(0, 8)}...</p>
              </div>
              <button
                onClick={() => setCurrentUser(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-First Customer Interface */}
      <div className="flex-1 flex flex-col">
        <CustomerInterface
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          cart={cart}
          loading={loading}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onAddToCart={onAddToCart}
          onUpdateQuantity={onUpdateQuantity}
          onPlaceOrder={onPlaceOrder}
          session={currentSession}
          currentCustomer={Array.isArray(sessionCustomers) ? sessionCustomers.find(c => c.phone === currentUser?.phone) || null : null}
          sessionOrders={sessionOrders || []}
          sessionParticipants={Array.isArray(sessionCustomers) ? sessionCustomers : []}
          onJoinSession={handleJoinSession}
          onRegenerateOTP={handleRegenerateOTP}
          onRequestBill={handleCloseSession}
          onCloseSession={handleCloseSession}
          onRefreshSession={() => currentSession ? fetchSessionData(currentSession.id) : Promise.resolve()}
          onCopyOTP={async () => {
            if (currentSession) {
              await navigator.clipboard.writeText(currentSession.session_otp);
            }
          }}
          onShareSession={async () => {
            if (currentSession) {
              const shareText = `Join our group ordering session! Use code: ${currentSession.session_otp}`;
              if (navigator.share) {
                await navigator.share({ text: shareText });
              } else {
                await navigator.clipboard.writeText(shareText);
              }
            }
          }}
          onShareBill={async () => {
            const total = (sessionOrders || []).reduce((sum, order) => sum + order.total, 0);
            const billText = `Session Bill - Total: $${(total / 100).toFixed(2)}`;
            if (navigator.share) {
              await navigator.share({ text: billText });
            } else {
              await navigator.clipboard.writeText(billText);
            }
          }}
          onDownloadBill={async () => {
            // Placeholder for bill download functionality
            console.log('Download bill functionality');
          }}
          onPrintBill={async () => {
            // Placeholder for bill print functionality
            window.print();
          }}
          onExitSession={handleExitSession}
        />
      </div>

      {/* Session Choice Modal */}
      <SessionChoiceModal
        isOpen={showSessionChoice}
        onClose={() => setShowSessionChoice(false)}
        tableId={tableInfo.id}
        restaurantId={tableInfo.restaurant_id}
        onJoinSession={async (otp, customerData) => {
          if (!otp && !customerData.name) {
            // This is a signal to start the join flow
            setSessionAction('join');
            setShowCustomerRegistration(true);
          } else {
            // This is the actual join call
            await handleJoinSession(otp, customerData);
          }
        }}
        onCreateSession={async (customerData) => {
          setShowSessionChoice(false);
          setSessionAction('create');
          setShowCustomerRegistration(true);
        }}
        title="Group Ordering Session"
      />

      {/* OTP Display Modal */}
      {currentSession && (
        <OTPDisplayModal
          isOpen={showOTPDisplay}
          onClose={() => setShowOTPDisplay(false)}
          session={currentSession}
          customers={Array.isArray(sessionCustomers) ? sessionCustomers : []}
          restaurantName={tableInfo.restaurant?.name || 'Restaurant'}
          tableNumber={tableInfo.table_number}
          onRegenerateOTP={handleRegenerateOTP}
          onCloseSession={handleCloseSession}
          onStartOrdering={handleStartOrdering}
          isAdmin={false} // Customers are not admins
        />
      )}

      {/* Customer Registration Modal */}
      <CustomerRegistrationModal
        isOpen={showCustomerRegistration}
        onClose={() => setShowCustomerRegistration(false)}
        onSubmit={async (customerData) => {
          if (sessionAction === 'join') {
            // For joining, store customer data and show OTP entry
            setPendingCustomerData(customerData);
            setShowCustomerRegistration(false);
            setShowOTPEntry(true);
          } else {
            // For creating, proceed with session creation
            await handleCreateSession(customerData);
          }
        }}
        title="Customer Registration"
        submitText="Continue"
        cancelText="Cancel"
      />

      {/* OTP Entry Modal for Joining Session */}
      {showOTPEntry && pendingCustomerData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Join Session</h3>
              <p className="text-gray-600">Enter the 6-digit OTP to join the session</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && i < 5) {
                        const nextInput = e.target.parentElement?.nextElementSibling?.querySelector('input') as HTMLInputElement;
                        if (nextInput) nextInput.focus();
                      }
                      // Update OTP value
                      const otpInputs = e.target.parentElement?.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
                      const otp = Array.from(otpInputs).map(input => input.value).join('');
                      if (otp.length === 6) {
                        // Auto-submit when 6 digits are entered
                        handleJoinSession(otp, pendingCustomerData);
                        setShowOTPEntry(false);
                        setPendingCustomerData(null);
                        setSessionAction(null);
                      }
                    }}
                  />
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowOTPEntry(false);
                    setPendingCustomerData(null);
                    setSessionAction(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablePage; 