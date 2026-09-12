import api from './axiosClient';

export const subjectsApi = {
  list:          ()              => api.get('/subjects'),
  create:        (data)          => api.post('/subjects', data),
  update:        (id, data)      => api.put(`/subjects/${id}`, data),
  remove:        (id)            => api.delete(`/subjects/${id}`),
  setPin:        (id, pin)       => api.post(`/subjects/${id}/pin`, { pin }),
  verifyPin:     (id, pin)       => api.post(`/subjects/${id}/verify-pin`, { pin }),
  // Verify by code: server looks up subject by code then verifies pin
  verifyByCode:  (code, pin)     => api.post('/subjects/verify-by-code', { code, pin }),
};
