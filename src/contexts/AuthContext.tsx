import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  full_name: string | null;
  faculty: string | null;
  level: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (data: SignupData) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  purchases: string[];
  addPurchase: (courseId: string) => Promise<void>;
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
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchases, setPurchases] = useState<string[]>([]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (!error && data) {
      setProfile(data);
    } else {
      // Profile might not exist yet for new signups, retry after a short delay
      setTimeout(async () => {
        const { data: retryData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (retryData) {
          setProfile(retryData);
        }
      }, 1000);
    }
  };

  const fetchPurchases = async (userId: string) => {
    const { data, error } = await supabase
      .from('purchases')
      .select('course_id')
      .eq('user_id', userId);
    
    if (!error && data) {
      setPurchases(data.map(p => p.course_id));
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchPurchases(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setPurchases([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchPurchases(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      sessionStorage.setItem('showWelcomeToast', 'true');
    }
    return { error: error as Error | null };
  };

  const signup = async (data: SignupData) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: data.fullName,
          faculty: data.faculty,
          level: data.level,
        },
      },
    });

    if (error) return { error: error as Error };
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setPurchases([]);
  };

  const addPurchase = async (courseId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        course_id: courseId,
      });

    if (!error) {
      setPurchases(prev => [...prev, courseId]);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      profile, 
      isLoading, 
      login, 
      signup, 
      logout, 
      purchases, 
      addPurchase 
    }}>
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
