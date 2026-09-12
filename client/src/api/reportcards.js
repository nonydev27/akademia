import api from './axiosClient';

export const reportcardsApi = {
  list:     (termId, status) => api.get('/report-cards', { params: { termId, status } }),
  get:      (studentId, termId) => api.get(`/report-cards/${studentId}/${termId}`),
  submit:   (studentId, termId) => api.post(`/report-cards/submit/${studentId}/${termId}`),
  approve:  (studentId, termId) => api.post(`/report-cards/approve/${studentId}/${termId}`),
  reject:   (studentId, termId) => api.post(`/report-cards/reject/${studentId}/${termId}`),
  publish:  (studentId, termId) => api.post(`/report-cards/publish/${studentId}/${termId}`),
  pdfUrl:   (studentId, termId) => `/api/v1/report-cards/${studentId}/${termId}/pdf`,
};
