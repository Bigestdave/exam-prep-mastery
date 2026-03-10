import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'ambassador' | 'modifier' | 'user';

const CACHE_KEY = 'cached_user_roles';

function getCachedRoles(): AppRole[] {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch { return []; }
}

function setCachedRoles(roles: AppRole[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(roles)); } catch {}
}

export function useRole() {
  const { user, isLoading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>(getCachedRoles);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Don't resolve loading until auth is done
    if (authLoading) return;

    async function fetchRoles() {
      if (!user) {
        setRoles([]);
        setCachedRoles([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (!error && data) {
        const fetched = data.map(r => r.role as AppRole);
        setRoles(fetched);
        setCachedRoles(fetched);
      }
      setIsLoading(false);
    }

    fetchRoles();
  }, [user, authLoading]);

  return {
    roles,
    isAdmin: roles.includes('admin'),
    isAmbassador: roles.includes('ambassador'),
    isModifier: roles.includes('modifier'),
    isLoading: authLoading || isLoading,
  };
}
