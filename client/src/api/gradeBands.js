import api from "./axiosClient";

export const gradeBandApi = {
  list: () => api.get("/grade-bands"),
  set: (data) => api.post("/grade-bands", data),
  remove: (id) => api.delete(`/grade-bands/${id}`),
};
