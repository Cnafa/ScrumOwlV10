import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import { User } from '../types';
import { ALL_USERS } from '../constants';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  signInWithGoogle: (rememberMe: boolean) => void;
  logout: () => void;
  lastAuthTime: number | null;
  updateLastAuthTime: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [lastAuthTime, setLastAuthTime] = useState<number | null>(null);

  const signInWithGoogle = (rememberMe: boolean) => {
    // In a real app, this would redirect to Google's OAuth consent screen
    // and pass the `rememberMe` flag to the backend to set the refresh
    // token's absolute expiry (e.g., 24h vs 30d).
    console.log(`TELEMETRY: auth.signIn`, { rememberMe }); 

    const googleUser = ALL_USERS.find(u => u.email === 'alice.j@gmail.com');
    if (googleUser) {
        setUser({
            ...googleUser,
            avatarUrl: `${googleUser.avatarUrl}&t=${new Date().getTime()}`
        });
        setLastAuthTime(new Date().getTime());
    } else {
        console.error("Simulated login failed: Could not find the mock Gmail user.");
        alert("Login failed. Only @gmail.com accounts are supported.");
    }
  };

  const logout = () => {
    setUser(null);
    setLastAuthTime(null);
    // Broadcast to other tabs to log them out too.
    try {
        const channel = new BroadcastChannel('auth');
        channel.postMessage({ type: 'LOGOUT' });
        channel.close();
    } catch (e) {
        console.warn('BroadcastChannel API not supported, logout may not sync across tabs.', e);
    }
  };

  const updateLastAuthTime = () => {
    setLastAuthTime(new Date().getTime());
  };

  const value = useMemo(() => ({
    isAuthenticated: !!user,
    user,
    signInWithGoogle,
    logout,
    lastAuthTime,
    updateLastAuthTime,
  }), [user, lastAuthTime]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};