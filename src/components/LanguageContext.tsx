"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from './types';
import { saveToLocalStorage, getFromLocalStorage } from './utils';

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
    // Import translations dynamically to avoid circular dependency
    const { translations } = require('./data');
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