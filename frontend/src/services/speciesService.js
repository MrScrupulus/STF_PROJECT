import { api } from "./api";

export const speciesService = {
  getAll: async () => {
    try {
      const response = await api.get("/api/species");
      return response.data || [];
    } catch (error) {
      console.error("Error fetching species:", error);
      throw error;
    }
  },

  getOne: async (id) => {
    try {
      const response = await api.get(`/api/species/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching species:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post("/api/admin/species", data);
      return response;
    } catch (error) {
      console.error("Error creating species:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/api/admin/species/${id}`, data);
      return response;
    } catch (error) {
      console.error("Error updating species:", error);
      throw error;
    }
  },
};
