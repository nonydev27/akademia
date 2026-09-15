import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { setAccessToken } from '../api/axiosClient';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // loadProfile fetches the Prisma profile from the server.
  // Returns the user object on success, null on a network/server error,
  // and throws on a 401 (no profile / invalid token).
  //
  // `opts.silent` (used by the background subscription refresh) means a
  // transient failure must NOT clear the already-loaded user — otherwise a
  // momentary network blip would visually sign the user out mid-session.
  const loadProfile = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    try {
      const res = await authApi.me();
      const next = res.data.user;
      // Only replace state when something actually changed. A background sync
      // fires every 60s; setting an identical-but-new object would re-render
      // the whole tree (and flicker the nav) for no reason.
      setUser((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      return next;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        // Authenticated Supabase session but no matching Prisma record —
        // this is a real "no profile" error; surface it to the caller.
        setUser(null);
        throw err;
      }
      // Any other error (network timeout, 5xx, Render cold-start) — treat as
      // a transient failure; keep the existing user on a silent refresh, and
      // return null so the login flow can decide what to do.
      if (!silent) setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAccessToken(session.access_token);
        try { await loadProfile(); } catch { /* profile fetch failed on restore, stay on login */ }
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

    let profile = null;
    try {
      profile = await loadProfile();
    } catch (err) {
      // loadProfile throws on 401 = no Prisma profile
      await supabase.auth.signOut();
      setAccessToken(null);
      const serverMsg = err?.response?.data?.message;
      throw new Error(
        serverMsg || 'This account has no Akademia profile. Contact your administrator.'
      );
    }

    if (!profile) {
      // loadProfile returned null — a transport-level failure (no HTTP response
      // at all). The most common cause in the packaged desktop app is CORS:
      // the API answered, but its Access-Control-Allow-Origin did not match the
      // Tauri webview origin, so the browser blocked the response and axios
      // surfaced it as a network error.
      await supabase.auth.signOut();
      setAccessToken(null);
      throw new Error(
        'Could not reach the server. Check your connection, or if this is the ' +
        'desktop app, that the API allows the app origin (CORS). Please try again.'
      );
    }

    return profile;
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setUser(null);
  }, []);

  // ── Live subscription/profile sync ──────────────────────
  // A Super Admin can change a school's plan, features, or expiry at any time.
  // The backend already enforces the new state on the next API call, but the
  // client's cached `user.features` (which drives the locked nav items) would
  // only update on re-login. Re-fetch the profile periodically and whenever
  // the window regains focus so the school sees the change mid-session.
  //
  // Super admins are skipped — they own the data being changed and a background
  // refresh would only add noise while they're editing.
  useEffect(() => {
    if (!user || user.role === 'SUPER_ADMIN') return undefined;

    const sync = async () => {
      // Only refresh when the tab is actually visible.
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      try {
        await loadProfile({ silent: true });
      } catch {
        // A 401 means the session is no longer valid (revoked/expired while the
        // app stayed open) — force a clean sign-out instead of leaving a stale
        // user on screen.
        await logout();
      }
    };

    const interval = setInterval(sync, 60000); // every 60s
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [user, loadProfile, logout]);

  // Allow profile refresh after edit
  const refreshProfile = useCallback(async () => {
    try { return await loadProfile(); } catch { return null; }
  }, [loadProfile]);

  const value = { user, loading, login, logout, refreshProfile };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
