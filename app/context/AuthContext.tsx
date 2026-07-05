'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

interface Profile {
  name: string | null;
  role: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: { name: null, role: null },
  loading: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({ name: null, role: null });
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile({ name: null, role: null });
    setLoading(false);
  };

  const fetchProfile = async (userId: string, email?: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('users')
      .select('name, role')
      .eq('id', userId)
      .single();

    setProfile({
      name: data?.name || email?.split('@')[0] || null,
      role: data?.role || null,
    });
  };

  useEffect(() => {
    const supabase = createClient();
    let hasResolvedAuth = false;

    const finishAuth = () => {
      if (!hasResolvedAuth) {
        hasResolvedAuth = true;
        setLoading(false);
      }
    };

    const timeoutId = window.setTimeout(finishAuth, 2000);

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser.email);
      } else {
        setProfile({ name: null, role: null });
      }
      finishAuth();
    });

    return () => {
      window.clearTimeout(timeoutId);
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}