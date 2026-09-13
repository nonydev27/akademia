import api from "./axiosClient";

export const importApi = {
  preview: (data) => api.post("/import/preview", data),
  commit: (data) => api.post("/import/commit", data),
};
