import api from './axiosClient';

export const feesApi = {
  createStructure:    (data)        => api.post('/fees/structures', data),
  getStudentAccount:  (id)          => api.get(`/fees/students/${id}`),
  createPayment:      (data)        => api.post('/fees/payments', data),
  outstanding:        ()            => api.get('/fees/outstanding'),
  override:           (id, reason)  => api.post(`/fees/students/${id}/override`, { reason }),
};
