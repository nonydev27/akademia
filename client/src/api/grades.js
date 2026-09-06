import api from './axiosClient';

export const gradesApi = {
  submitCa:    (data)               => api.post('/grades/ca', data),
  submitExam:  (data)               => api.post('/grades/exam', data),
  finalize:    (studentId, termId)  => api.post(`/grades/finalize/${studentId}/${termId}`),
  classSheet:  (classId, termId)    => api.get(`/grades/class/${classId}/${termId}`),
};
