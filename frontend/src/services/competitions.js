import { api } from "./api";
import { ENDPOINTS } from "./endpoints";

export const competitionsService = {
  getAll: async () => {
    const response = await api.get("/competitions");
    return response;
  },

  getOne: (id) => api.get(ENDPOINTS.competitions.detail(id)),

  create: (data) => api.post(ENDPOINTS.competitions.list, data),

  update: (id, data) => api.put(ENDPOINTS.competitions.detail(id), data),

  delete: (id) => api.delete(ENDPOINTS.competitions.detail(id)),

  start: (id) => api.put(ENDPOINTS.competitions.start(id), {}),

  end: (id) => api.put(ENDPOINTS.competitions.end(id), {}),
};
