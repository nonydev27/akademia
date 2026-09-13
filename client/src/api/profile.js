import api from './axiosClient';

export const profileApi = {
  get:    ()     => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  uploadAvatar: (imageBase64) => api.post('/profile/upload-avatar', { imageBase64 }),
};
