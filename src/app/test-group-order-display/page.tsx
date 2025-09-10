'use client';

import React, { useState } from 'react';
import { GroupOrderDisplay } from '../../components/GroupOrderDisplay';
import NotificationToast from '../../components/NotificationToast';

export default function TestGroupOrderDisplayPage() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    read: boolean;
    created_at: Date;
  }>>([]);

  // Sample session ID for testing
  const sampleSessionId = 'test-session-123';
  const currentCustomerId = 'customer-1';

  const addNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { 
      id, 
      message, 
      type, 
      read: false, 
      created_at: new Date() 
    }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleRefresh = () => {
    addNotification('Session data refreshed successfully', 'success');
  };

  const handleRequestBill = () => {
    addNotification('Bill request sent to waiter', 'success');
  };

  const handleRegenerateOTP = () => {
    addNotification('OTP regenerated successfully', 'success');
  };

  const handleCloseSession = () => {
    addNotification('Session closed successfully', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Group Order Display Demo
          </h1>
          <p className="text-gray-600">
            This page demonstrates the GroupOrderDisplay component with sample session data.
          </p>
        </div>

        <GroupOrderDisplay
          sessionId={sampleSessionId}
          currentCustomerId={currentCustomerId}
          onRefresh={handleRefresh}
          onRequestBill={handleRequestBill}
          onRegenerateOTP={handleRegenerateOTP}
          onCloseSession={handleCloseSession}
          className="mb-8"
        />

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Component Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Session Overview</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Session OTP display</li>
                <li>• Session duration tracking</li>
                <li>• Session status indicator</li>
                <li>• Real-time refresh capability</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Statistics</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Total participants count</li>
                <li>• Total orders count</li>
                <li>• Total amount calculation</li>
                <li>• Average order amount</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Customer Orders</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Customer attribution</li>
                <li>• Expandable order details</li>
                <li>• Current user highlighting</li>
                <li>• Order status tracking</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Interactive Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Request bill functionality</li>
                <li>• Regenerate OTP option</li>
                <li>• Close session capability</li>
                <li>• Mobile-responsive design</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toasts */}
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
        />
      ))}
    </div>
  );
} 