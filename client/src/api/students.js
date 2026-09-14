import api from './axiosClient';

export const studentsApi = {
  list:            (params)   => api.get('/students', { params }),
  get:             (id)       => api.get(`/students/${id}`),
  create:          (data)     => api.post('/students', data),
  update:          (id, data) => api.patch(`/students/${id}`, data),
  deactivate:      (id)       => api.delete(`/students/${id}`),
  addGuardian:     (id, data) => api.post(`/students/${id}/guardians`, data),
  bulkDelete:      (ids)      => api.post('/students/bulk-delete', { ids }),
  checkDuplicate:  (data)     => api.post('/students/check-duplicate', data),
};
