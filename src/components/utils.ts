import React from 'react';
import { Notification, MenuCategory } from './types';
import { v4 as uuidv4 } from 'uuid';

// Memoized currency formatter for better performance
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Memoized time formatter
const timeFormatter = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
});

// Disable caching to prevent consistency issues
// const currencyCache = new Map<number, string>();
// const timeAgoCache = new Map<number, string>();

// Simple currency formatting without caching
export const formatCurrency = (amount: number): string => {
  return currencyFormatter.format(amount);
};

// Optimized order total calculation
export const calculateOrderTotal = (items: Array<{ price: number; quantity: number }>): number => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Optimized status color mapping
const statusColorMap = {
  'order_received': 'bg-blue-100 text-blue-800',
  'preparing': 'bg-yellow-100 text-yellow-800',
  'prepared': 'bg-green-100 text-green-800',
  'delivered': 'bg-gray-100 text-gray-800',
  'active': 'bg-blue-100 text-blue-800',
  'completed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
  'available': 'bg-green-100 text-green-800',
  'occupied': 'bg-red-100 text-red-800',
  'needs_reset': 'bg-yellow-100 text-yellow-800',
} as const;

export const getItemStatusColor = (status: keyof typeof statusColorMap): string => {
  return statusColorMap[status] || 'bg-gray-100 text-gray-800';
};

export const getTableStatusColor = (status: string): string => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800';
    case 'occupied':
      return 'bg-red-100 text-red-800';
    case 'needs_reset':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Simple time ago calculation without caching
export const getTimeAgo = (date: Date): string => {
  const now = Date.now();
  const timeDiff = now - date.getTime();
  
  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return timeFormatter.format(-days, 'day');
  } else if (hours > 0) {
    return timeFormatter.format(-hours, 'hour');
  } else if (minutes > 0) {
    return timeFormatter.format(-minutes, 'minute');
  } else {
    return timeFormatter.format(-seconds, 'second');
  }
};

// Optimized phone number validation with regex compilation
const phoneRegex = /^[6-9]\d{9}$/;
export const validatePhoneNumber = (phone: string): boolean => {
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

// Optimized special notes validation
export const validateSpecialNotes = (notes: string): { isValid: boolean; error?: string } => {
  if (!notes.trim()) {
    return { isValid: true };
  }
  
  if (notes.length > 200) {
    return { isValid: false, error: 'Special notes cannot exceed 200 characters' };
  }
  
  // Check for potentially harmful content
  const harmfulPatterns = /<script|javascript:|on\w+\s*=|data:text\/html/i;
  if (harmfulPatterns.test(notes)) {
    return { isValid: false, error: 'Special notes contain invalid content' };
  }
  
  return { isValid: true };
};

// Optimized notification management
export const addNotification = (
  notifications: Notification[],
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  message: string,
  type: 'success' | 'error' | 'warning' | 'info',
  duration: number = 5000
): void => {
  const newNotification: Notification = {
    id: `notification_${Date.now()}_${Math.random()}`,
    message,
    type,
    read: false,
    created_at: new Date(),
  };

  setNotifications(prev => [newNotification, ...prev]);

  // Auto-remove notification after duration
  setTimeout(() => {
    setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
  }, duration);
};

// Optimized debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Optimized throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Optimized deep clone function for objects
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  
  return obj;
};

// Optimized array deduplication
export const deduplicateArray = <T>(array: T[], key?: keyof T): T[] => {
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

// Optimized string truncation
export const truncateString = (str: string, maxLength: number, suffix: string = '...'): string => {
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength - suffix.length) + suffix;
};

// Optimized number formatting
export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// Optimized date formatting
export const formatDate = (date: Date, options: Intl.DateTimeFormatOptions = {}): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat('en-IN', defaultOptions).format(date);
};

// Optimized time formatting
export const formatTime = (date: Date, options: Intl.DateTimeFormatOptions = {}): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  return new Intl.DateTimeFormat('en-IN', defaultOptions).format(date);
};

// Optimized search function
export const searchItems = <T>(
  items: T[],
  searchTerm: string,
  searchKeys: (keyof T)[]
): T[] => {
  if (!searchTerm.trim()) {
    return items;
  }
  
  const term = searchTerm.toLowerCase();
  
  return items.filter(item =>
    searchKeys.some(key => {
      const value = item[key];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(term);
      }
      if (typeof value === 'number') {
        return value.toString().includes(term);
      }
      return false;
    })
  );
};

// Optimized sorting function
export const sortItems = <T>(
  items: T[],
  sortKey: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...items].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];
    
    if (aValue < bValue) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

// Optimized group by function
export const groupBy = <T, K extends keyof T>(
  items: T[],
  key: K
): Map<T[K], T[]> => {
  const groups = new Map<T[K], T[]>();
  
  for (const item of items) {
    const groupKey = item[key];
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(item);
  }
  
  return groups;
};

// Optimized chunk function for pagination
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Simplified function wrapper - no memoization to prevent consistency issues
export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T => {
  // Return original function without caching
  return fn;
};

// Cleanup function - no longer needed without caches
export const clearCaches = (): void => {
  // No caches to clear - prevents consistency issues
  console.log('Cache clearing disabled for consistency');
};

// QR Code utilities
export const generateQRCode = (data: string): string => {
  // In a real implementation, this would use a QR code library
  // For now, return a placeholder
  return `qr://${data}`;
};

// Order utilities
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





// Kitchen station utilities
export const getKitchenStationName = (station: string): string => {
  return station;
};

// Menu category utilities
export const getCategoryName = (category: MenuCategory | string): string => {
  if (typeof category === 'string') {
    return category;
  }
  return category.name;
};

// Real-time utilities
export const createSocketConnection = () => {
  // In a real implementation, this would connect to a Socket.IO server
  // For now, return a mock socket
  return {
    emit: (event: string, data: unknown) => {
      console.log(`Socket emit: ${event}`, data);
    },
    on: (event: string, callback: (data: unknown) => void) => {
      console.log(`Socket listening: ${event}`);
    },
    disconnect: () => {
      console.log('Socket disconnected');
    }
  };
};

// Local storage utilities
export const saveToLocalStorage = (key: string, value: string | number | boolean | object): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getFromLocalStorage = (key: string): string | number | boolean | object | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
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