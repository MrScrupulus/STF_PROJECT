export const ENDPOINTS = {
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    verifyEmail: (token) => `/api/verify-email/${token}`,
    me: "/api/auth/me",
  },
  species: {
    list: "/api/species",
    detail: (id) => `/api/species/${id}`,
    update: (id) => `/api/species/${id}`,
    create: "/api/species",
    toggleBonus: (id) => `/api/species/${id}/toggle-bonus`,
  },
  catches: {
    list: "/api/catches",
    detail: (id) => `/api/catches/${id}`,
    validate: (id) => `/api/catches/${id}/validate`,
  },
  teams: {
    list: "/api/teams",
    detail: (id) => `/api/teams/${id}`,
  },
  competitions: {
    list: "/api/competitions",
    detail: (id) => `/api/competitions/${id}`,
    start: (id) => `/api/competitions/${id}/start`,
    end: (id) => `/api/competitions/${id}/end`,
  },
};
