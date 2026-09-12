import api from "./axiosClient";

export const classesApi = {
  list: () => api.get("/classes"),
  create: (data) => api.post("/classes", data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  remove: (id) => api.delete(`/classes/${id}`),
};
