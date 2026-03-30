import { api } from "./api";
import { ENDPOINTS } from "./endpoints";

export const competitionsService = {
  getAll: async (page = 1, limit = 10) => {
    const response = await api.get(`/api/competitions?page=${page}&limit=${limit}`);
    return response;
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

  uploadReglementImage: async (id, file) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.uploadFile(`/api/admin/competitions/${id}/reglement-image`, formData);
  },

  deleteReglementImage: (id, index) =>
    api.delete(`/api/admin/competitions/${id}/reglement-image/${index}`),

  delete: (id) => api.delete(`/api/admin/competitions/${id}`),

  start: (id) => api.put(ENDPOINTS.competitions.start(id), {}),

  end: (id) => api.put(ENDPOINTS.competitions.end(id), {}),

  getStats: (id) => api.get(`/api/admin/competitions/${id}/stats`),
  getPublicStats: (id) => api.get(`/api/competitions/${id}/stats`), // Endpoint public pour les statistiques
  
  unregisterFromCompetition: async (competitionId) => {
    const response = await api.post(`/api/competitions/${competitionId}/teams/unregister`);
    return response;
  },
};
