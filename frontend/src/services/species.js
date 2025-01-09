import { api } from "./api";
import { ENDPOINTS } from "./endpoints";

export const speciesService = {
  getAll: () => api.get(ENDPOINTS.species.list),

  getOne: (id) => api.get(ENDPOINTS.species.detail(id)),

  create: (data) => api.post(ENDPOINTS.species.list, data),

  update: (id, data) => api.put(ENDPOINTS.species.detail(id), data),

  delete: (id) => api.delete(ENDPOINTS.species.detail(id)),
};
