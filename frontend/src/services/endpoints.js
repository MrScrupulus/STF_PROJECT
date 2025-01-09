export const ENDPOINTS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    verifyEmail: (token) => `/verify-email/${token}`,
    me: "/auth/me",
  },
  species: {
    list: "/species",
    detail: (id) => `/species/${id}`,
  },
  catches: {
    list: "/catches",
    detail: (id) => `/catches/${id}`,
    validate: (id) => `/catches/${id}/validate`,
  },
  teams: {
    list: "/teams",
    detail: (id) => `/teams/${id}`,
  },
  competitions: {
    list: "/competitions",
    detail: (id) => `/competitions/${id}`,
    start: (id) => `/competitions/${id}/start`,
    end: (id) => `/competitions/${id}/end`,
  },
};
