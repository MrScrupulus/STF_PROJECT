import api from "./api";
import { ENDPOINTS } from "./endpoints";

export const teamsService = {
  getAll: async () => {
    try {
      const response = await api.get("/teams");
      return response;
    } catch (error) {
      console.error("Error fetching teams:", error);
      throw error;
    }
  },

  getOne: (id) => api.get(`/teams/${id}`),

  create: (data) => api.post("/teams", data),

  update: (id, data) => api.put(`/teams/${id}`, data),

  delete: (id) => api.delete(`/teams/${id}`),
};
