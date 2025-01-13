import api from "./api";

export const competitionService = {
  getAll: async () => {
    const response = await api.get("/admin/competitions");
    return response.competitions;
  },
  getById: (id) => api.get(`/admin/competitions/${id}`),
  create: (data) => api.post("/admin/competitions", data),
  update: (id, data) => api.put(`/admin/competitions/${id}`, data),
  delete: (id) => api.delete(`/admin/competitions/${id}`),
};
