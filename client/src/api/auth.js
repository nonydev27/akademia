import api from './axiosClient';

export const authApi = {
  me: () => api.get('/auth/me'),
};
