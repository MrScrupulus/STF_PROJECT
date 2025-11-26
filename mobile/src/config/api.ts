// Configuration de l'API
// En développement, utiliser l'IP de votre machine au lieu de localhost
// Pour Android: utiliser 10.0.2.2 pour accéder à localhost de l'émulateur
// Pour iOS: utiliser localhost ou l'IP de votre machine
// Pour production: utiliser l'URL de votre serveur

const getApiBaseUrl = () => {
  if (__DEV__) {
    // En développement
    // Android émulateur: 10.0.2.2
    // iOS simulateur: localhost
    // Device physique: IP de votre machine (ex: 192.168.1.100)
    return 'http://10.0.2.2:8001'; // Pour Android émulateur
    // return 'http://localhost:8001'; // Pour iOS simulateur
    // return 'http://192.168.1.100:8001'; // Pour device physique (remplacer par votre IP)
  }
  // En production
  return 'https://api.votre-domaine.com';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    verifyEmail: (token: string) => `/api/auth/verify-email/${token}`,
    me: '/api/auth/me',
    refresh: '/api/auth/refresh',
  },
  species: {
    list: '/api/species',
    detail: (id: number) => `/api/species/${id}`,
  },
  catches: {
    list: '/api/catches',
    detail: (id: number) => `/api/catches/${id}`,
    validate: (id: number) => `/api/catches/${id}/validate`,
  },
  teams: {
    list: '/api/teams',
    detail: (id: number) => `/api/teams/${id}`,
  },
  competitions: {
    list: '/api/competitions',
    detail: (id: number) => `/api/competitions/${id}`,
    start: (id: number) => `/api/competitions/${id}/start`,
    end: (id: number) => `/api/competitions/${id}/end`,
  },
};

