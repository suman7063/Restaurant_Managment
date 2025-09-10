"use client"
import React, { useState } from 'react';
import { SessionInfoHeader } from '../../components/SessionInfoHeader';
import { ParticipantsList } from '../../components/ParticipantsList';
import { SessionTotal } from '../../components/SessionTotal';
import { Session, SessionCustomer, Order } from '../../components/types';

// Sample data for testing
const sampleSession: Session = {
  id: 'session-123',
  table_id: 'table-456',
  restaurant_id: 'restaurant-789',
  session_otp: '123456',
  status: 'active',
  total_amount: 0,
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  updated_at: new Date()
};

const sampleParticipants: SessionCustomer[] = [
  {
    id: 'customer-1',
    session_id: 'session-123',
    name: 'John Doe',
    phone: '+1234567890',
    joined_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'customer-2',
    session_id: 'session-123',
    name: 'Jane Smith',
    phone: '+1987654321',
    joined_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000)
  },
  {
    id: 'customer-3',
    session_id: 'session-123',
    name: 'Bob Johnson',
    phone: '+1555666777',
    joined_at: new Date(Date.now() - 1 * 60 * 60 * 1000)
  }
];

const sampleOrders: Order[] = [
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
          description: 'Classic tomato and mozzarella',
          price: 1500,
          category_id: 'cat-1',
          prepTime: 15,
          rating: 4.5,
          image: '/pizza.jpg',
          available: true,
          kitchen_stations: ['pizza'],
          is_veg: true,
          cuisine_type: 'Italian'
        },
        quantity: 1,
        status: 'delivered',
        kitchen_station: 'pizza',
        price_at_time: 1500,
        customer_id: 'customer-1',
        customer_name: 'John Doe',
        customer_phone: '+1234567890'
      }
    ],
    status: 'completed',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    total: 1500,
    estimated_time: 15,
    is_joined_order: true,
    session_id: 'session-123',
    session_otp: '123456',
    customer_id: 'customer-1',
    restaurant_id: 'restaurant-789',
    is_session_order: true
  },
  {
    id: 'order-2',
    table: 1,
    customer_name: 'Jane Smith',
    customer_phone: '+1987654321',
    items: [
      {
        id: 'item-2',
        order_id: 'order-2',
        menu_item: {
          id: 'menu-2',
          name: 'Caesar Salad',
          description: 'Fresh romaine with caesar dressing',
          price: 800,
          category_id: 'cat-2',
          prepTime: 8,
          rating: 4.2,
          image: '/salad.jpg',
          available: true,
          kitchen_stations: ['salad'],
          is_veg: true,
          cuisine_type: 'American'
        },
        quantity: 1,
        status: 'delivered',
        kitchen_station: 'salad',
        price_at_time: 800,
        customer_id: 'customer-2',
        customer_name: 'Jane Smith',
        customer_phone: '+1987654321'
      },
      {
        id: 'item-3',
        order_id: 'order-2',
        menu_item: {
          id: 'menu-3',
          name: 'Chicken Pasta',
          description: 'Creamy alfredo with grilled chicken',
          price: 1800,
          category_id: 'cat-3',
          prepTime: 20,
          rating: 4.7,
          image: '/pasta.jpg',
          available: true,
          kitchen_stations: ['pasta'],
          is_veg: false,
          cuisine_type: 'Italian'
        },
        quantity: 1,
        status: 'preparing',
        kitchen_station: 'pasta',
        price_at_time: 1800,
        customer_id: 'customer-2',
        customer_name: 'Jane Smith',
        customer_phone: '+1987654321'
      }
    ],
    status: 'active',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    total: 2600,
    estimated_time: 20,
    is_joined_order: true,
    session_id: 'session-123',
    session_otp: '123456',
    customer_id: 'customer-2',
    restaurant_id: 'restaurant-789',
    is_session_order: true
  },
  {
    id: 'order-3',
    table: 1,
    customer_name: 'Bob Johnson',
    customer_phone: '+1555666777',
    items: [
      {
        id: 'item-4',
        order_id: 'order-3',
        menu_item: {
          id: 'menu-4',
          name: 'Beef Burger',
          description: 'Juicy beef patty with fresh vegetables',
          price: 1200,
          category_id: 'cat-4',
          prepTime: 12,
          rating: 4.3,
          image: '/burger.jpg',
          available: true,
          kitchen_stations: ['grill'],
          is_veg: false,
          cuisine_type: 'American'
        },
        quantity: 1,
        status: 'order_received',
        kitchen_station: 'grill',
        price_at_time: 1200,
        customer_id: 'customer-3',
        customer_name: 'Bob Johnson',
        customer_phone: '+1555666777'
      }
    ],
    status: 'active',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    total: 1200,
    estimated_time: 12,
    is_joined_order: true,
    session_id: 'session-123',
    session_otp: '123456',
    customer_id: 'customer-3',
    restaurant_id: 'restaurant-789',
    is_session_order: true
  }
];

const TestSessionManagementPage: React.FC = () => {
  const [currentCustomer] = useState<SessionCustomer>(sampleParticipants[0]);
  const [loading, setLoading] = useState(false);

  const handleCopyOTP = async () => {
    try {
      await navigator.clipboard.writeText(sampleSession.session_otp);
      alert('OTP copied to clipboard!');
    } catch (error) {
      console.error('Error copying OTP:', error);
    }
  };

  const handleRegenerateOTP = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('OTP regenerated! (This is a demo)');
    setLoading(false);
  };

  const handleCloseSession = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Session closed! (This is a demo)');
    setLoading(false);
  };

  const handleShareSession = async () => {
    const shareText = `Join our group ordering session! Use code: ${sampleSession.session_otp}`;
    if (navigator.share) {
      await navigator.share({ text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('Session link copied to clipboard!');
    }
  };

  const handleRequestBill = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Bill requested! (This is a demo)');
    setLoading(false);
  };

  const handleShareBill = async () => {
    const billText = `Session Bill - Total: $${(sampleOrders.reduce((sum, order) => sum + order.total, 0) / 100).toFixed(2)}`;
    if (navigator.share) {
      await navigator.share({ text: billText });
    } else {
      await navigator.clipboard.writeText(billText);
      alert('Bill copied to clipboard!');
    }
  };

  const handleDownloadBill = async () => {
    alert('Bill download functionality (This is a demo)');
  };

  const handlePrintBill = async () => {
    alert('Bill print functionality (This is a demo)');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Management Demo</h1>
          <p className="text-gray-600">Testing the new session management components</p>
        </div>

        {/* Session Info Header */}
        <SessionInfoHeader
          session={sampleSession}
          participants={sampleParticipants}
          currentCustomer={currentCustomer}
          totalAmount={sampleOrders.reduce((sum, order) => sum + order.total, 0)}
          orderCount={sampleOrders.length}
          onCopyOTP={handleCopyOTP}
          onRegenerateOTP={handleRegenerateOTP}
          onCloseSession={handleCloseSession}
          onShareSession={handleShareSession}
          loading={loading}
        />

        {/* Participants List */}
        <ParticipantsList
          participants={sampleParticipants}
          orders={sampleOrders}
          currentCustomer={currentCustomer}
          loading={loading}
        />

        {/* Session Total */}
        <SessionTotal
          session={sampleSession}
          participants={sampleParticipants}
          orders={sampleOrders}
          currentCustomer={currentCustomer}
          onRequestBill={handleRequestBill}
          onShareBill={handleShareBill}
          onDownloadBill={handleDownloadBill}
          onPrintBill={handlePrintBill}
          loading={loading}
        />

        {/* Demo Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Demo Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Session Code: {sampleSession.session_otp}</li>
            <li>• Participants: {sampleParticipants.length}</li>
            <li>• Total Orders: {sampleOrders.length}</li>
            <li>• Total Amount: ${(sampleOrders.reduce((sum, order) => sum + order.total, 0) / 100).toFixed(2)}</li>
            <li>• Current User: {currentCustomer.name}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestSessionManagementPage; 