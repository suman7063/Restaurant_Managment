"use client"
import React, { useState } from 'react';
import { SessionInfoHeader } from '@/components/SessionInfoHeader';
import { ParticipantsList } from '@/components/ParticipantsList';
import { SessionTotal } from '@/components/SessionTotal';
import { Session, SessionCustomer, Order } from '@/components/types';

export default function TestSessionInfoPage() {
  // Mock data for testing
  const [session] = useState<Session>({
    id: '1',
    table_id: 'Table 5',
    restaurant_id: 'rest-1',
    session_otp: '123456',
    status: 'active',
          total_amount: 8500, // ₹85.00
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updated_at: new Date()
  });

  const [participants] = useState<SessionCustomer[]>([
    {
      id: '1',
      session_id: '1',
      name: 'John Doe',
      phone: '+1234567890',
      joined_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      session_id: '1',
      name: 'Jane Smith',
      phone: '+1234567891',
      joined_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000)
    },
    {
      id: '3',
      session_id: '1',
      name: 'Bob Johnson',
      phone: '+1234567892',
      joined_at: new Date(Date.now() - 1 * 60 * 60 * 1000)
    }
  ]);

  const [orders] = useState<Order[]>([
    {
      id: '1',
      table: 5,
      customer_name: 'John Doe',
      customer_phone: '+1234567890',
      items: [
        {
          id: '1',
          order_id: '1',
          menu_item: { id: '1', name: 'Burger', description: 'Delicious burger', price: 1500, category_id: '1', prepTime: 15, rating: 4.5, image: '', available: true, kitchen_stations: ['grill'], is_veg: false, cuisine_type: 'American' },
          quantity: 2,
          status: 'delivered',
          kitchen_station: 'grill',
          price_at_time: 1500
        }
      ],
      status: 'completed',
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      total: 3000,
      estimated_time: 15,
      is_joined_order: true,
      customer_id: '1',
      is_session_order: true
    },
    {
      id: '2',
      table: 5,
      customer_name: 'Jane Smith',
      customer_phone: '+1234567891',
      items: [
        {
          id: '2',
          order_id: '2',
          menu_item: { id: '2', name: 'Pizza', description: 'Margherita pizza', price: 2000, category_id: '1', prepTime: 20, rating: 4.8, image: '', available: true, kitchen_stations: ['oven'], is_veg: true, cuisine_type: 'Italian' },
          quantity: 1,
          status: 'delivered',
          kitchen_station: 'oven',
          price_at_time: 2000
        }
      ],
      status: 'completed',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      total: 2000,
      estimated_time: 20,
      is_joined_order: true,
      customer_id: '2',
      is_session_order: true
    },
    {
      id: '3',
      table: 5,
      customer_name: 'Bob Johnson',
      customer_phone: '+1234567892',
      items: [
        {
          id: '3',
          order_id: '3',
          menu_item: { id: '3', name: 'Pasta', description: 'Spaghetti carbonara', price: 1800, category_id: '1', prepTime: 18, rating: 4.6, image: '', available: true, kitchen_stations: ['stove'], is_veg: false, cuisine_type: 'Italian' },
          quantity: 1,
          status: 'delivered',
          kitchen_station: 'stove',
          price_at_time: 1800
        },
        {
          id: '4',
          order_id: '3',
          menu_item: { id: '4', name: 'Salad', description: 'Caesar salad', price: 800, category_id: '1', prepTime: 8, rating: 4.3, image: '', available: true, kitchen_stations: ['cold'], is_veg: true, cuisine_type: 'American' },
          quantity: 1,
          status: 'delivered',
          kitchen_station: 'cold',
          price_at_time: 800
        }
      ],
      status: 'completed',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      total: 2600,
      estimated_time: 18,
      is_joined_order: true,
      customer_id: '3',
      is_session_order: true
    }
  ]);

  const [currentCustomer] = useState<SessionCustomer>(participants[0]);

  // Mock handlers
  const handleCopyOTP = async () => {
    await navigator.clipboard.writeText(session.session_otp);
    console.log('OTP copied to clipboard');
  };

  const handleRegenerateOTP = async () => {
    console.log('Regenerating OTP...');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('OTP regenerated');
  };

  const handleCloseSession = async () => {
    console.log('Closing session...');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Session closed');
  };

  const handleShareSession = async () => {
    console.log('Sharing session...');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Session shared');
  };

  const handleRemoveParticipant = async (participantId: string) => {
    console.log('Removing participant:', participantId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Participant removed');
  };

  const handleRequestBill = async () => {
    console.log('Requesting bill...');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Bill requested');
  };

  const handleShareBill = async () => {
    console.log('Sharing bill...');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Bill shared');
  };

  const handleDownloadBill = async () => {
    console.log('Downloading bill...');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Bill downloaded');
  };

  const handlePrintBill = async () => {
    console.log('Printing bill...');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Bill printed');
  };

  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Info Components Demo</h1>
          <p className="text-gray-600">
            Enhanced session info components with social sharing, participant management, and bill splitting features
          </p>
        </div>

        <div className="space-y-8">
          {/* Session Info Header */}
          <SessionInfoHeader
            session={session}
            participants={participants}
            currentCustomer={currentCustomer}
            totalAmount={totalAmount}
            orderCount={orders.length}
            onCopyOTP={handleCopyOTP}
            onRegenerateOTP={handleRegenerateOTP}
            onCloseSession={handleCloseSession}
            onShareSession={handleShareSession}
            isAdmin={true}
          />

          {/* Participants List */}
          <ParticipantsList
            participants={participants}
            orders={orders}
            currentCustomer={currentCustomer}
            isAdmin={true}
            onRemoveParticipant={handleRemoveParticipant}
          />

          {/* Session Total */}
          <SessionTotal
            session={session}
            participants={participants}
            orders={orders}
            currentCustomer={currentCustomer}
            onRequestBill={handleRequestBill}
            onShareBill={handleShareBill}
            onDownloadBill={handleDownloadBill}
            onPrintBill={handlePrintBill}
          />
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Enhanced Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">SessionInfoHeader</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Social sharing (WhatsApp, Telegram, SMS, Email)</li>
                <li>• QR code generation</li>
                <li>• Admin-only controls</li>
                <li>• Real-time session duration</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">ParticipantsList</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Activity status indicators</li>
                <li>• Order history viewing</li>
                <li>• Participant removal (admin)</li>
                <li>• Spending patterns</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">SessionTotal</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Bill splitting options</li>
                <li>• Payment method tracking</li>
                <li>• Financial analytics</li>
                <li>• Bill preview & generation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 