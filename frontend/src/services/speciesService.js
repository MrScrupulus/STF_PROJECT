import api from "./api";

export const speciesService = {
  getAll: async () => {
    const response = await api.get("/species");
    return response.data;
  },

  create: (data) => api.post("/admin/species", data),

  update: (id, data) => api.put(`/admin/species/${id}`, data),

  delete: (id) => api.delete(`/admin/species/${id}`),
};
