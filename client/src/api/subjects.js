import api from './axiosClient';

export const subjectsApi = {
  list:          ()              => api.get('/subjects'),
  // Teacher: subjects assigned to me (with PIN status + classes)
  mine:          ()              => api.get('/subjects/mine'),
  create:        (data)          => api.post('/subjects', data),
  update:        (id, data)      => api.put(`/subjects/${id}`, data),
  remove:        (id)            => api.delete(`/subjects/${id}`),
  setPin:        (id, pin)       => api.post(`/subjects/${id}/pin`, { pin }),
  // Teacher: set / reset own subject PIN (forgotten-PIN path)
  resetPin:      (id, pin)       => api.post(`/subjects/${id}/reset-pin`, { pin }),
  verifyPin:     (id, pin)       => api.post(`/subjects/${id}/verify-pin`, { pin }),
  // Verify by code: server looks up subject by code then verifies pin
  verifyByCode:  (code, pin)     => api.post('/subjects/verify-by-code', { code, pin }),
};
