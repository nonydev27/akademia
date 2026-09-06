import api from './axiosClient';

export const attendanceApi = {
  submit:     (data)             => api.post('/attendance', data),
  forClass:   (classId, date)    => api.get(`/attendance/class/${classId}`, { params: { date } }),
  forStudent: (id)               => api.get(`/attendance/student/${id}`),
};
