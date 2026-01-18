import { api } from "./api";

export const catchesService = {
  getAll: (competitionId) => api.get(`/api/competitions/${competitionId}/catches`),

  getOne: (competitionId, id) => api.get(`/api/competitions/${competitionId}/catches/${id}`),

  create: async (competitionId, data) => {
    try {
      const response = await api.post(`/api/competitions/${competitionId}/catches`, data);
      return response;
    } catch (error) {
      console.error("Error creating catch:", error);
      throw error;
    }
  },

  update: (competitionId, id, data) => api.put(`/api/competitions/${competitionId}/catches/${id}`, data),

  delete: (competitionId, id) => api.delete(`/api/competitions/${competitionId}/catches/${id}`),

  validate: (competitionId, id) => api.patch(`/api/competitions/${competitionId}/catches/${id}/validate`, {}),
};
