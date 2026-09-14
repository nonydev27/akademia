import api from "./axiosClient";

export const termsApi = {
  list: () => api.get("/terms"),
  create: (data) => api.post("/terms", data),
  update: (id, data) => api.put(`/terms/${id}`, data),
  remove: (id) => api.delete(`/terms/${id}`),
  createAcademicYear: (data) => api.post("/terms/academic-years", data),
};
