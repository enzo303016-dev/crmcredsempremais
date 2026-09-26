import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PermissionKey } from '../types/crm';
import { apiService } from '../services/apiService';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  logout: () => Promise<void>;
  hasPermission: (permKey: PermissionKey) => boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check initial session
    const sessionUser = apiService.getCurrentSessionUser();
    if (sessionUser) {
      setCurrentUser(sessionUser);
    }
    setIsLoading(false);
  }, []);

  const refreshUser = () => {
    const updated = apiService.getCurrentSessionUser();
    if (updated) {
      setCurrentUser(updated);
    }
  };

  const login = async (email: string, pass: string): Promise<User> => {
    const user = await apiService.login(email, pass);
    setCurrentUser(user);
    return user;
  };

  const logout = async () => {
    await apiService.logout(currentUser);
    setCurrentUser(null);
  };

  const hasPermission = (permKey: PermissionKey): boolean => {
    return apiService.hasPermission(currentUser, permKey);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        hasPermission,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
