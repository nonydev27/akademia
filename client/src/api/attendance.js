import api from './axiosClient';

export const attendanceApi = {
  submit:     (data)                     => api.post('/attendance', data),
  forClass:   (classId, date, subjectId) => api.get(`/attendance/class/${classId}`, { params: { date, subjectId } }),
  summary:    (classId, params)          => api.get('/attendance/summary', { params: { classId, ...params } }),
  forStudent: (studentId)                => api.get(`/attendance/student/${studentId}`),
};
