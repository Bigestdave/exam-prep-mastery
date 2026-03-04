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
  addPurchases: (courseIds: string[]) => Promise<void>;
}

interface SignupData {
  email: string;
  password: string;
  fullName: string;
  faculty: string;
  level: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate or retrieve a persistent device ID
function getDeviceId(): string {
  const key = 'lcuprep_device_id';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchases, setPurchases] = useState<string[]>([]);

  const trackSession = async (action: 'track' | 'check' = 'track') => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.access_token) return true;

      const { data, error } = await supabase.functions.invoke('track-session', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: {
          device_id: getDeviceId(),
          action,
        },
      });

      if (error) {
        console.error('Failed to track session:', error);
        return true; // Don't block on errors
      }

      // If checking validity and device was kicked out
      if (action === 'check' && data && data.valid === false) {
        console.log('Device session invalidated, signing out...');
        await supabase.auth.signOut();
        setProfile(null);
        setPurchases([]);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to track session:', err);
      return true;
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (!error && data) {
      setProfile(data);
    } else {
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
      const uniqueCourseIds = [...new Set(data.map(p => p.course_id))];
      setPurchases(uniqueCourseIds);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchPurchases(session.user.id);
            // Track device on login/token refresh
            trackSession('track');
          }, 0);
        } else {
          setProfile(null);
          setPurchases([]);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchPurchases(session.user.id);
        // Check if this device is still valid
        trackSession('check');
      }
      setIsLoading(false);
    });

    // Periodic check every 5 minutes — if device was kicked, sign out
    const interval = setInterval(() => {
      if (user) {
        trackSession('check');
      }
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      sessionStorage.setItem('showWelcomeToast', 'true');
      trackSession('track');
    }
    return { error: error as Error | null };
  };

  const signup = async (data: SignupData) => {
    const redirectUrl = `${window.location.origin}/`;
    const referralCode = localStorage.getItem("referral_code");
    
    const { data: signupData, error } = await supabase.auth.signUp({
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

    // Record referral if there's a code stored
    if (referralCode && signupData.user) {
      try {
        await supabase.functions.invoke("record-referral", {
          body: {
            referral_code: referralCode,
            referred_user_id: signupData.user.id,
          },
        });
        localStorage.removeItem("referral_code");
      } catch (e) {
        console.error("Failed to record referral:", e);
      }
    }

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

  const addPurchases = async (courseIds: string[]) => {
    if (!user || courseIds.length === 0) return;
    const records = courseIds.map(courseId => ({
      user_id: user.id,
      course_id: courseId,
    }));
    const { error } = await supabase.from('purchases').insert(records);
    if (!error) {
      setPurchases(prev => [...new Set([...prev, ...courseIds])]);
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
      addPurchase,
      addPurchases 
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
