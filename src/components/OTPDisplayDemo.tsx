"use client"
import React, { useState } from 'react';
import { OTPDisplayModal } from './OTPDisplayModal';
import { Session, SessionCustomer, Order } from './types';

const sampleSession: Session = {
  id: 'demo-session-123',
  table_id: 'table-456',
  restaurant_id: 'restaurant-789',
  session_otp: '123456',
  status: 'active',
  total_amount: 4500,
  created_at: new Date(Date.now() - 30 * 60 * 1000),
  updated_at: new Date(),
  deleted_at: undefined
};

const sampleCustomers: SessionCustomer[] = [
  {
    id: 'customer-1',
    session_id: 'demo-session-123',
    name: 'John Doe',
    phone: '+1234567890',
    joined_at: new Date(Date.now() - 25 * 60 * 1000),
    deleted_at: undefined
  },
  {
    id: 'customer-2',
    session_id: 'demo-session-123',
    name: 'Jane Smith',
    phone: '+1987654321',
    joined_at: new Date(Date.now() - 20 * 60 * 1000),
    deleted_at: undefined
  }
];

const sampleOrders: Order[] = [
  {
    id: 'order-1',
    table: 5,
    customer_name: 'John Doe',
    customer_phone: '+1234567890',
    items: [
      {
        id: 'item-1',
        order_id: 'order-1',
        menu_item: {
          id: 'menu-1',
          name: 'Classic Burger',
          description: 'Juicy beef burger',
          price: 1500,
          category_id: 'category-1',
          prepTime: 15,
          rating: 4.5,
          image: '/burger.jpg',
          available: true,
          kitchen_stations: ['grill'],
          is_veg: false,
          cuisine_type: 'American'
        },
        quantity: 1,
        status: 'preparing',
        kitchen_station: 'grill',
        price_at_time: 1500,
        selected_add_ons: []
      }
    ],
    status: 'active',
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
    total: 1500,
    estimated_time: 15,
    is_joined_order: true,
    is_session_order: true
  }
];

export const OTPDisplayDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState(sampleSession);

  const handleRegenerateOTP = async () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentSession(prev => ({
      ...prev,
      session_otp: newOtp,
      updated_at: new Date()
    }));
  };

  const handleCloseSession = async () => {
    setCurrentSession(prev => ({
      ...prev,
      status: 'billed' as const,
      updated_at: new Date()
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          OTP Display Modal Demo
        </h1>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Current Session: {currentSession.session_otp}
          </h2>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300"
          >
            Open OTP Display Modal
          </button>
        </div>

        <OTPDisplayModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          session={currentSession}
          customers={sampleCustomers}
          orders={sampleOrders}
          restaurantName="Demo Restaurant"
          tableNumber={5}
          onRegenerateOTP={handleRegenerateOTP}
          onCloseSession={handleCloseSession}
          onStartOrdering={() => alert('Starting ordering...')}
          isAdmin={true}
        />
      </div>
    </div>
  );
};

export default OTPDisplayDemo; 