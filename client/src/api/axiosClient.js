import axios from 'axios';

// ── In-memory token, kept in sync with the Supabase session ──────────────
let _accessToken = null;
export function setAccessToken(token) { _accessToken = token; }
export function getAccessToken()      { return _accessToken; }

// ── Axios instance ────────────────────────────────────────
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
});

// ── Request interceptor — attach Bearer token ─────────────
axiosClient.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// ── Response interceptor — a 401 means the Supabase session is no longer
// valid (expired/revoked); send the user back to login ───────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      setAccessToken(null);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
