import api from './axiosClient';

export const communicationsApi = {
  list:  (params) => api.get('/communications', { params }),
  retry: (id)     => api.post(`/communications/retry/${id}`),
  send:  (data)   => api.post('/communications/send', data),
};
