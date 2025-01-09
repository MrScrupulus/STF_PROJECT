import { api } from "./api";
import { ENDPOINTS } from "./endpoints";

export const teamsService = {
  getAll: () => api.get(ENDPOINTS.teams.list),

  getOne: (id) => api.get(ENDPOINTS.teams.detail(id)),

  create: (data) => api.post(ENDPOINTS.teams.list, data),

  update: (id, data) => api.put(ENDPOINTS.teams.detail(id), data),

  delete: (id) => api.delete(ENDPOINTS.teams.detail(id)),
};
