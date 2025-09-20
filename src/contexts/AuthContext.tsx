import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking authentication state
    const checkAuth = () => {
      const savedUser = localStorage.getItem('oshicall_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simulate authentication
    const mockUser: User = {
      id: '1',
      username: 'user123',
      email,
      avatar_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
      total_spent: 50000,
      successful_bids: 3,
      created_at: new Date().toISOString(),
    };
    setUser(mockUser);
    localStorage.setItem('oshicall_user', JSON.stringify(mockUser));
  };

  const signUp = async (email: string, password: string, username: string) => {
    // Simulate registration
    const mockUser: User = {
      id: '1',
      username,
      email,
      avatar_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
      total_spent: 0,
      successful_bids: 0,
      created_at: new Date().toISOString(),
    };
    setUser(mockUser);
    localStorage.setItem('oshicall_user', JSON.stringify(mockUser));
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('oshicall_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}