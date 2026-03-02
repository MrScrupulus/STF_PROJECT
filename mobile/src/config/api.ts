// Configuration de l'API
// En développement, utiliser l'IP de votre machine au lieu de localhost
// Pour Android: utiliser 10.0.2.2 pour accéder à localhost de l'émulateur
// Pour iOS: utiliser localhost ou l'IP de votre machine
// Pour production: utiliser l'URL de votre serveur
//
// Pour tester depuis un autre réseau, définir EXPO_PUBLIC_API_URL dans .env.local
// Exemple: EXPO_PUBLIC_API_URL=http://votre-ip-publique:8001
// Ou utiliser un tunnel: EXPO_PUBLIC_API_URL=https://votre-tunnel.ngrok.io

const getApiBaseUrl = () => {
  // Priorité 1: Variable d'environnement (pour tester depuis un autre réseau)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (__DEV__) {
    // En développement
    // Android émulateur: 10.0.2.2
    // iOS simulateur: localhost
    // Device physique: IP de votre machine
    // return 'http://10.0.2.2:8001'; // Pour Android émulateur
    // return 'http://localhost:8001'; // Pour iOS simulateur
    return 'http://192.168.1.129:8001'; // Pour device physique (IP de votre machine)
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
    forgotPassword: '/password-reset/request',
    resetPassword: '/password-reset/reset',
    updateProfile: '/api/auth/profile',
    updatePassword: '/api/auth/password',
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
    myTeams: '/api/teams/my-teams',
    myHistory: '/api/teams/my-history',
    invite: (id: number) => `/api/teams/${id}/invite`,
    invitations: {
      my: '/api/teams/invitations/my',
      accept: (id: number) => `/api/teams/invitations/${id}/accept`,
      reject: (id: number) => `/api/teams/invitations/${id}/reject`,
      team: (teamId: number) => `/api/teams/${teamId}/invitations`,
    },
  },
  competitions: {
    list: '/api/competitions',
    detail: (id: number) => `/api/competitions/${id}`,
    start: (id: number) => `/api/competitions/${id}/start`,
    end: (id: number) => `/api/competitions/${id}/end`,
    stats: (id: number) => `/api/admin/competitions/${id}/stats`,
    statsPublic: (id: number) => `/api/competitions/${id}/stats`,
    registerTeam: (competitionId: number) => `/api/competitions/${competitionId}/teams/register`,
    unregisterTeam: (competitionId: number) => `/api/competitions/${competitionId}/teams/unregister`,
  },
  notifications: {
    list: '/api/notifications',
    unread: '/api/notifications/unread',
    count: '/api/notifications/count',
    markRead: (id: number) => `/api/notifications/${id}/read`,
    markAllRead: '/api/notifications/read-all',
  },
  notificationPreferences: {
    get: '/api/notification-preferences',
    update: '/api/notification-preferences',
  },
};

