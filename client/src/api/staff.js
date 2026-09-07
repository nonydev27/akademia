import api from './axiosClient';

export const staffApi = {
  // Teachers
  list:       ()          => api.get('/staff-members'),
  create:     (data)      => api.post('/staff-members', data),
  deactivate: (id)        => api.delete(`/staff-members/${id}`),

  // Assignments
  listAssignments:  (params)  => api.get('/staff-members/assignments', { params }),
  assign:           (data)    => api.post('/staff-members/assignments', data),
  removeAssignment: (id)      => api.delete(`/staff-members/assignments/${id}`),
};
