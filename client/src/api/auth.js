import api from './axiosClient';

export const authApi = {
  me: () => api.get('/auth/me'),
};

export const passwordResetApi = {
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};
