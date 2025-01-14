import api from "./api";

export const competitionService = {
  // Route publique pour tous les utilisateurs
  getAll: () => api.get("/api/competitions"),

  // Routes admin protégées
  getAllAdmin: () => api.get("/api/admin/competitions"),
  create: (data) => api.post("/api/admin/competitions", data),
  update: (id, data) => api.put(`/api/admin/competitions/${id}`, data),
  delete: (id) => api.delete(`/api/admin/competitions/${id}`),
};
