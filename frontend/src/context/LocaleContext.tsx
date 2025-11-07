import React, { createContext, useState, useContext, ReactNode } from 'react';
import { translations } from '../translations';

type Locale = 'en-US' | 'fa-IR';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof typeof translations['en-US']) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const savedLocale = window.localStorage.getItem('scrumowl-locale');
      return savedLocale === 'fa-IR' ? 'fa-IR' : 'en-US';
    } catch {
      return 'en-US';
    }
  });

  const setLocale = (newLocale: Locale) => {
    try {
        window.localStorage.setItem('scrumowl-locale', newLocale);
    } catch (e) {
        console.error("Failed to save locale", e);
    }
    setLocaleState(newLocale);
  };

  const t = (key: keyof typeof translations['en-US']): string => {
    // Fallback to English if a Farsi key is missing
    return translations[locale][key] || translations['en-US'][key];
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = (): LocaleContextType => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
