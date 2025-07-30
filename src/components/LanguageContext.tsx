"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from './types';
import { saveToLocalStorage, getFromLocalStorage } from './utils';

// Basic translations for common UI elements
const translations = {
  en: {
    'welcome': 'Welcome',
    'menu': 'Menu',
    'orders': 'Orders',
    'tables': 'Tables',
    'settings': 'Settings',
    'logout': 'Logout',
    'add_to_cart': 'Add to Cart',
    'place_order': 'Place Order',
    'total': 'Total',
    'quantity': 'Quantity',
    'price': 'Price',
    'status': 'Status',
    'pending': 'Pending',
    'preparing': 'Preparing',
    'ready': 'Ready',
    'delivered': 'Delivered',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'available': 'Available',
    'occupied': 'Occupied',
    'needs_reset': 'Needs Reset',
    'admin': 'Admin',
    'waiter': 'Waiter',
    'chef': 'Chef',
    'customer': 'Customer',
    'customize': 'Customize',
    'add_ons': 'Add-ons',
    'special_notes': 'Special Notes',
    'loading': 'Loading...'
  },
  hi: {
    'welcome': 'स्वागत है',
    'menu': 'मेनू',
    'orders': 'ऑर्डर',
    'tables': 'टेबल',
    'settings': 'सेटिंग्स',
    'logout': 'लॉगआउट',
    'add_to_cart': 'कार्ट में जोड़ें',
    'place_order': 'ऑर्डर करें',
    'total': 'कुल',
    'quantity': 'मात्रा',
    'price': 'कीमत',
    'status': 'स्थिति',
    'pending': 'लंबित',
    'preparing': 'तैयार हो रहा है',
    'ready': 'तैयार',
    'delivered': 'पहुंचाया गया',
    'completed': 'पूर्ण',
    'cancelled': 'रद्द',
    'available': 'उपलब्ध',
    'occupied': 'कब्जा',
    'needs_reset': 'रीसेट की आवश्यकता',
    'admin': 'एडमिन',
    'waiter': 'वेटर',
    'chef': 'शेफ',
    'customer': 'ग्राहक',
    'customize': 'कस्टमाइज़',
    'add_ons': 'एड-ऑन',
    'special_notes': 'विशेष नोट्स',
    'loading': 'लोड हो रहा है...'
  },
  kn: {
    'welcome': 'ಸುಸ್ವಾಗತ',
    'menu': 'ಮೆನು',
    'orders': 'ಆರ್ಡರ್‌ಗಳು',
    'tables': 'ಟೇಬಲ್‌ಗಳು',
    'settings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    'logout': 'ಲಾಗ್‌ಔಟ್',
    'add_to_cart': 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',
    'place_order': 'ಆರ್ಡರ್ ಮಾಡಿ',
    'total': 'ಒಟ್ಟು',
    'quantity': 'ಪರಿಮಾಣ',
    'price': 'ಬೆಲೆ',
    'status': 'ಸ್ಥಿತಿ',
    'pending': 'ಬಾಕಿ',
    'preparing': 'ತಯಾರಾಗುತ್ತಿದೆ',
    'ready': 'ಸಿದ್ಧ',
    'delivered': 'ತಲುಪಿಸಲಾಗಿದೆ',
    'completed': 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    'cancelled': 'ರದ್ದು',
    'available': 'ಲಭ್ಯ',
    'occupied': 'ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ',
    'needs_reset': 'ರೀಸೆಟ್ ಅಗತ್ಯ',
    'admin': 'ನಿರ್ವಾಹಕ',
    'waiter': 'ಸೇವಕ',
    'chef': 'ಅಡುಗೆ',
    'customer': 'ಗ್ರಾಹಕ',
    'customize': 'ಕಸ್ಟಮೈಸ್',
    'add_ons': 'ಆಡ್-ಆನ್‌ಗಳು',
    'special_notes': 'ವಿಶೇಷ ಟಿಪ್ಪಣಿಗಳು',
    'loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  getTranslation: (key: string) => string;
  getLocalizedName: (item: any) => string;
  getLocalizedDescription: (item: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: Language;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ 
  children, 
  initialLanguage = 'en' 
}) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = getFromLocalStorage('preferred_language') as Language;
    if (savedLanguage && ['en', 'hi', 'kn'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    saveToLocalStorage('preferred_language', lang);
  };

  const getTranslation = (key: string): string => {
    const langTranslations = translations[language] as Record<string, string>;
    return langTranslations[key] || (translations.en as Record<string, string>)[key] || key;
  };

  const getLocalizedName = (item: any): string => {
    if (!item) return '';
    
    const nameKey = `name_${language}`;
    return item[nameKey] || item.name || '';
  };

  const getLocalizedDescription = (item: any): string => {
    if (!item) return '';
    
    const descKey = `description_${language}`;
    return item[descKey] || item.description || '';
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    getTranslation,
    getLocalizedName,
    getLocalizedDescription
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 