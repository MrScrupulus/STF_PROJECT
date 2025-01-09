import { api } from "./api";

export const competitionService = {
  getAll: () => api.get("/competitions"),
  getById: (id) => api.get(`/competitions/${id}`),
  create: (data) => api.post("/competitions", data),
  update: (id, data) => api.put(`/competitions/${id}`, data),
  delete: (id) => api.delete(`/competitions/${id}`),
};
