import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient, { setAccessToken } from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // { id, tenantId, role, fullName, email }
  const [loading, setLoading] = useState(true);   // true while restoring session

  // ── Restore session on mount ──────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.post('/auth/refresh-token');
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
      } catch {
        // No valid refresh cookie – start as logged-out
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Login ─────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  // ── Logout ────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await axiosClient.post('/auth/logout'); } catch { /* ignore */ }
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = { user, loading, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
