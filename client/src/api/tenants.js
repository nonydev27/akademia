import api from './axiosClient';

export const tenantsApi = {
  list:               ()           => api.get('/tenants'),
  get:                (id)         => api.get(`/tenants/${id}`),
  create:             (data)       => api.post('/tenants', data),
  update:               (id, data)   => api.patch(`/tenants/${id}`, data),
  updateSubscription:   (id, data)   => api.patch(`/tenants/${id}/subscription`, data),
  updateFeatures:       (id, data)   => api.patch(`/tenants/${id}/features`, data),
  createAdmin:          (id, data)   => api.post(`/tenants/${id}/admin`, data),
};
