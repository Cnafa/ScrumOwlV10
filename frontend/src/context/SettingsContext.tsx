import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';

export interface AppSettings {
  theme: 'light' | 'dark';
  enableRealtime: boolean;
  enableIdleReminder: boolean; // Old reminder
  enableFinishDraftReminder: boolean; // US-18 reminder
}

interface SettingsContextType {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

const defaultSettings: AppSettings = {
  theme: 'light',
  enableRealtime: true,
  enableIdleReminder: true,
  enableFinishDraftReminder: true, // US-18
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  
  const value = useMemo(() => ({ settings, setSettings }), [settings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
