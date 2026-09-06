import api from './axiosClient';

export const subscriptionsApi = {
  status: ()          => api.get('/subscriptions/status'),
  renew:  (data)      => api.post('/subscriptions/renew/self-serve', data),
  verify: (reference) => api.get('/subscriptions/renew/verify', { params: { reference } }),
};
