import api from './axiosClient';

export const staffApi = {
  list:             ()       => api.get('/staff-members'),
  // Teacher portal: my own assignments (classes + subjects by code)
  mine:             ()       => api.get('/staff-members/mine'),
  create:           (data)   => api.post('/staff-members', data),
  deactivate:       (id)     => api.delete(`/staff-members/${id}`),
  listAssignments:  (params) => api.get('/staff-members/assignments', { params }),
  assign:           (data)   => api.post('/staff-members/assignments', data),
  removeAssignment: (id)     => api.delete(`/staff-members/assignments/${id}`),
};
