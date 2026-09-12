import api from "./axiosClient";

export const termsApi = {
  // Labelled term options for dropdowns, e.g. "2025/2026 - Term 1".
  list: () => api.get("/terms"),
};
