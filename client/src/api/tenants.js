import api from './axiosClient';

export const tenantsApi = {
  list:               ()           => api.get('/tenants'),
  get:                (id)         => api.get(`/tenants/${id}`),
  plans:              ()           => api.get('/tenants/plans'),
  create:             (data)       => api.post('/tenants', data),
  update:               (id, data)   => api.patch(`/tenants/${id}`, data),
  updateSubscription:   (id, data)   => api.patch(`/tenants/${id}/subscription`, data),
  updateFeatures:       (id, data)   => api.patch(`/tenants/${id}/features`, data),
  updatePlan:           (id, plan)   => api.patch(`/tenants/${id}/plan`, { plan }),
  createAdmin:          (id, data)   => api.post(`/tenants/${id}/admin`, data),
};
