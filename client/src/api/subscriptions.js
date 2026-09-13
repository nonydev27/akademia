import api from "./axiosClient";

export const subscriptionsApi = {
  status: () => api.get("/subscriptions/status"),
  renew: (data) => api.post("/subscriptions/renew/self-serve", data),
  verify: (reference, plan) =>
    api.get("/subscriptions/renew/verify", {
      params: plan ? { reference, plan } : { reference },
    }),
};
