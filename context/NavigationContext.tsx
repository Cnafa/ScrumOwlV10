import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import { useLocale } from './LocaleContext';

type View = 'KANBAN' | 'ITEMS' | 'EPICS' | 'EVENTS' | 'REPORTS' | 'SETTINGS' | 'MEMBERS' | 'SPRINTS';

interface NavigationContextType {
  currentView: View;
  setCurrentView: (view: View) => void;
  breadcrumbs: string[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<View>('KANBAN');
  const { t } = useLocale();

  const breadcrumbs = useMemo(() => {
    switch (currentView) {
        case 'KANBAN': return [t('sprintBoard')];
        case 'ITEMS': return [t('itemsView')];
        case 'SPRINTS': return [t('sprints')];
        case 'EPICS': return [t('epics')];
        case 'EVENTS': return [t('eventsView')];
        case 'REPORTS': return [t('reportsDashboard')];
        case 'SETTINGS': return [t('settings')];
        case 'MEMBERS': return [t('membersAndRoles')];
        default: return [];
    }
  }, [currentView, t]);

  const value = useMemo(() => ({
    currentView,
    setCurrentView,
    breadcrumbs,
  }), [currentView, breadcrumbs]);

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};