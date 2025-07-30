import React from 'react';
import { Notification, Language } from './types';
import { v4 as uuidv4 } from 'uuid';

// Notification utilities
export const addNotification = (
  notifications: Notification[],
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info'
) => {
  const newNotification: Notification = {
    id: Date.now(),
    message: message,
    type,
    read: false,
    created_at: new Date()
  };

  setNotifications(prev => [newNotification, ...prev]);

  // Auto-remove notification after 5 seconds
  setTimeout(() => {
    setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
  }, 5000);
};

// QR Code utilities
export const generateQRCode = (data: string): string => {
  // In a real implementation, this would use a QR code library
  // For now, return a placeholder
  return `qr://${data}`;
};

// Order utilities
export const calculateOrderTotal = (items: any[]): number => {
  return items.reduce((total, item) => {
    let itemTotal = item.price * item.quantity;
    
    // Add customization price
    if (item.selected_customization) {
      itemTotal += item.selected_customization.price_variation * item.quantity;
    }
    
    // Add add-ons price
    if (item.selected_add_ons) {
      itemTotal += item.selected_add_ons.reduce((addOnTotal: number, addOn: any) => {
        return addOnTotal + (addOn.price * item.quantity);
      }, 0);
    }
    
    return total + itemTotal;
  }, 0);
};

export const getOrderStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'bg-blue-500';
    case 'completed':
      return 'bg-green-500';
    case 'cancelled':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export const getItemStatusColor = (status: string): string => {
  switch (status) {
    case 'order_received':
      return 'bg-yellow-500';
    case 'preparing':
      return 'bg-orange-500';
    case 'prepared':
      return 'bg-green-500';
    case 'delivered':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

export const getTableStatusColor = (status: string): string => {
  switch (status) {
    case 'available':
      return 'bg-green-500';
    case 'occupied':
      return 'bg-red-500';
    case 'needs_reset':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

// Time utilities
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

// Validation utilities
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+91|0)?[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const validateSpecialNotes = (notes: string): boolean => {
  return notes.length <= 200; // 200 character limit as per PRD
};

// Kitchen station utilities
export const getKitchenStationName = (station: string, language: Language = 'en'): string => {
  const stationMap: Record<string, any> = {
    'Main Kitchen': {
      en: 'Main Kitchen',
      hi: 'मुख्य रसोई',
      kn: 'ಮುಖ್ಯ ಅಡುಗೆಮನೆ'
    },
    'Tandoor Station': {
      en: 'Tandoor Station',
      hi: 'तंदूर स्टेशन',
      kn: 'ತಂದೂರ್ ಸ್ಟೇಷನ್'
    },
    'Dessert Station': {
      en: 'Dessert Station',
      hi: 'मिठाई स्टेशन',
      kn: 'ಅಡುಗೆ ಸ್ಟೇಷನ್'
    }
  };
  
  return stationMap[station]?.[language] || stationMap[station]?.en || station;
};

// Menu category utilities
export const getCategoryName = (category: string, language: Language = 'en'): string => {
  const categoryMap: Record<string, any> = {
    'Appetizer': {
      en: 'Appetizer',
      hi: 'शुरुआती',
      kn: 'ಆರಂಭಿಕ'
    },
    'Main Course': {
      en: 'Main Course',
      hi: 'मुख्य पाठ्यक्रम',
      kn: 'ಮುಖ್ಯ ಕೋರ್ಸ್'
    },
    'Dessert': {
      en: 'Dessert',
      hi: 'मिठाई',
      kn: 'ಅಡುಗೆ'
    },
    'Beverage': {
      en: 'Beverage',
      hi: 'पेय',
      kn: 'ಪಾನೀಯ'
    },
    'Breakfast': {
      en: 'Breakfast',
      hi: 'नाश्ता',
      kn: 'ಅಲ್ಪಾಹಾರ'
    }
  };
  
  return categoryMap[category]?.[language] || categoryMap[category]?.en || category;
};

// Real-time utilities
export const createSocketConnection = () => {
  // In a real implementation, this would connect to a Socket.IO server
  // For now, return a mock socket
  return {
    emit: (event: string, data: any) => {
      console.log(`Socket emit: ${event}`, data);
    },
    on: (event: string, callback: (data: any) => void) => {
      console.log(`Socket listening: ${event}`);
    },
    disconnect: () => {
      console.log('Socket disconnected');
    }
  };
};

// Local storage utilities
export const saveToLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getFromLocalStorage = (key: string): any => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

// Currency formatting
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Debounce utility
export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generate unique IDs
export const generateId = (): string => {
  return uuidv4();
};

// Check if user is on mobile
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

// Check if user is on tablet
export const isTablet = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > 768 && window.innerWidth <= 1024;
};

// Check if user is on desktop
export const isDesktop = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > 1024;
}; 