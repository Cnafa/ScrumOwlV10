import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LocaleProvider } from './context/LocaleContext';
import { SettingsProvider } from './context/SettingsContext';
import { BoardProvider } from './context/BoardContext';
import { NavigationProvider } from './context/NavigationContext';
import { ErrorBoundary } from './components/system/ErrorBoundary';
import { bootstrapApp } from './app/bootstrap';

// Initialize crash logger and global hooks
bootstrapApp();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <LocaleProvider>
        <SettingsProvider>
          <AuthProvider>
            <BoardProvider>
              <NavigationProvider>
                <App />
              </NavigationProvider>
            </BoardProvider>
          </AuthProvider>
        </SettingsProvider>
      </LocaleProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
