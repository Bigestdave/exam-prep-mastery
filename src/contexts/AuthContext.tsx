import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  fullName: string;
  faculty: string;
  level: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  purchases: string[];
  addPurchase: (courseId: string) => void;
}

interface SignupData {
  email: string;
  password: string;
  fullName: string;
  faculty: string;
  level: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchases, setPurchases] = useState<string[]>([]);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('lcu_user');
    const storedPurchases = localStorage.getItem('lcu_purchases');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedPurchases) {
      setPurchases(JSON.parse(storedPurchases));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Demo login - in production, this would call Supabase
    const demoUser: User = {
      id: 'demo-user-1',
      email,
      fullName: 'Demo Student',
      faculty: 'IRM',
      level: '100L',
    };
    setUser(demoUser);
    localStorage.setItem('lcu_user', JSON.stringify(demoUser));
  };

  const signup = async (data: SignupData) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      fullName: data.fullName,
      faculty: data.faculty,
      level: data.level,
    };
    setUser(newUser);
    localStorage.setItem('lcu_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lcu_user');
  };

  const addPurchase = (courseId: string) => {
    const newPurchases = [...purchases, courseId];
    setPurchases(newPurchases);
    localStorage.setItem('lcu_purchases', JSON.stringify(newPurchases));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, purchases, addPurchase }}>
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
