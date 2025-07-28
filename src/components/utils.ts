import React from 'react';
import { Notification } from './types';

// Utility functions
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const generateQR = (): boolean[][] => {
  const size = 8;
  const pattern: boolean[][] = [];
  for (let i = 0; i < size; i++) {
    pattern[i] = [];
    for (let j = 0; j < size; j++) {
      pattern[i][j] = Math.random() < 0.5;
    }
  }
  return pattern;
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ready': return 'bg-green-100 text-green-800 border-green-200';
    case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getTableStatusColor = (status: string): string => {
  switch (status) {
    case 'available': return 'bg-green-500 hover:bg-green-600';
    case 'occupied': return 'bg-red-500 hover:bg-red-600';
    case 'cleaning': return 'bg-yellow-500 hover:bg-yellow-600';
    default: return 'bg-gray-500 hover:bg-gray-600';
  }
};

export const addNotification = (
  notifications: Notification[], 
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  message: string, 
  type: string = 'info'
): void => {
  const id = Date.now();
  const notification: Notification = { id, message, type };
  setNotifications([...notifications, notification]);
  
  setTimeout(() => {
    setNotifications((prev: Notification[]) => prev.filter(n => n.id !== id));
  }, 4000);
}; 