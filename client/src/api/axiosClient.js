import axios from 'axios';

// ── In-memory token (never in localStorage) ──────────────
let _accessToken = null;
export function setAccessToken(token) { _accessToken = token; }
export function getAccessToken()      { return _accessToken; }

// ── Axios instance ────────────────────────────────────────
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,  // send refresh-token httpOnly cookie
});

// ── Request interceptor — attach Bearer token ─────────────
axiosClient.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// ── Response interceptor — handle 401 → refresh ──────────
let _isRefreshing   = false;
let _pendingQueue   = [];

function processQueue(err, token) {
  _pendingQueue.forEach(({ resolve, reject }) =>
    err ? reject(err) : resolve(token)
  );
  _pendingQueue = [];
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    // Avoid infinite loops on the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh-token') &&
      !original.url?.includes('/auth/login')
    ) {
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _pendingQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return axiosClient(original);
        });
      }

      original._retry   = true;
      _isRefreshing     = true;

      try {
        const res = await axiosClient.post('/auth/refresh-token');
        const newToken = res.data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        _isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
