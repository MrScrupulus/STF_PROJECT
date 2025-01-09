import { api } from "./api";
import { ENDPOINTS } from "./endpoints";

export const catchesService = {
  getAll: () => api.get(ENDPOINTS.catches.list),

  getOne: (id) => api.get(ENDPOINTS.catches.detail(id)),

  create: (data) => api.post(ENDPOINTS.catches.list, data),

  update: (id, data) => api.put(ENDPOINTS.catches.detail(id), data),

  delete: (id) => api.delete(ENDPOINTS.catches.detail(id)),

  validate: (id) => api.put(ENDPOINTS.catches.validate(id), {}),
};
