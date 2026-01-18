import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import * as SplashScreen from 'expo-splash-screen';

interface AuthContextType {
  isAuthenticated: boolean | null;
  setIsAuthenticated: (value: boolean) => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const checkAuth = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        // Ignorer les erreurs de SplashScreen
        console.warn('Erreur lors du masquage du splash screen:', error);
      }
    }
  };

  useEffect(() => {
    // Prévenir le masquage automatique du splash screen
    SplashScreen.preventAutoHideAsync();
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
