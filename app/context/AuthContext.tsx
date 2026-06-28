'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Profile {
  name: string | null;
  role: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: { name: null, role: null },
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({ name: null, role: null });
  const [loading, setLoading] = useState(true);

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

    // Single getSession() call for the whole app
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser.email);
      }
      setLoading(false);
    });

    // Keep in sync with sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser.email);
      } else {
        setProfile({ name: null, role: null });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}