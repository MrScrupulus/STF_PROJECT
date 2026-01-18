import { api } from "./api";
import { ENDPOINTS } from "./endpoints";

export const competitionsService = {
  getAll: async () => {
    const response = await api.get("/api/competitions");
    return response.competitions || [];
  },

  getOngoing: async () => {
    try {
      const response = await api.get("/api/competitions/ongoing");
      return response.competitions || [];
    } catch (error) {
      console.error("Error fetching ongoing competitions:", error);
      throw error;
    }
  },

  getOne: (id) => api.get(ENDPOINTS.competitions.detail(id)),

  create: (data) => api.post("/api/admin/competitions", data),

  update: (id, data) => api.put(ENDPOINTS.competitions.detail(id), data),

  delete: (id) => api.delete(`/api/admin/competitions/${id}`),

  start: (id) => api.put(ENDPOINTS.competitions.start(id), {}),

  end: (id) => api.put(ENDPOINTS.competitions.end(id), {}),

  getStats: (id) => api.get(`/api/admin/competitions/${id}/stats`),
  getPublicStats: (id) => api.get(`/api/admin/competitions/${id}/stats`), // Même endpoint, permissions gérées côté backend
};
