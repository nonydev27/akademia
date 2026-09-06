import api from './axiosClient';

export const reportcardsApi = {
  publish:  (studentId, termId) => api.post(`/report-cards/publish/${studentId}/${termId}`),
  get:      (studentId, termId) => api.get(`/report-cards/${studentId}/${termId}`),
  download: (studentId, termId) => api.get(`/report-cards/${studentId}/${termId}/pdf`, { responseType: 'blob' }),
};
