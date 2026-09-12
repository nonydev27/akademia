import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { setAccessToken } from '../api/axiosClient';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data.user); // includes tenantName
      return res.data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAccessToken(session.access_token);
        await loadProfile();
      }
      if (active) setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAccessToken(session?.access_token ?? null);
      if (event === 'SIGNED_OUT') setUser(null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    setAccessToken(data.session.access_token);
    const profile = await loadProfile();
    if (!profile) {
      await supabase.auth.signOut();
      throw new Error('This account has no Akademia profile. Contact your administrator.');
    }
    return profile;
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setUser(null);
  }, []);

  // Allow profile refresh after edit
  const refreshProfile = useCallback(() => loadProfile(), [loadProfile]);

  const value = { user, loading, login, logout, refreshProfile };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
