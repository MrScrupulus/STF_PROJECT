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
  // Priorité 1: Variable d'environnement (EAS, .env, ou test hors LAN)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (__DEV__) {
    // Device sur le même Wi-Fi que le PC. Hors LAN → définir EXPO_PUBLIC_API_URL=https://api.scrupy.com
    // Ngrok (--tunnel) ne sert qu'à charger le JS Expo, pas l'API.
    return 'http://192.168.1.129:8001';
  }
  return 'https://api.scrupy.com';
};

export const API_BASE_URL = getApiBaseUrl();

// Log l'URL utilisée au chargement (pour debug)
if (__DEV__) {
  console.log('[API] Base URL:', API_BASE_URL);
}

export const API_ENDPOINTS = {
  me: {
    stats: '/api/me/stats',
    journalCatches: '/api/me/journal/catches',
  },
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
    /** Stats perso (authentifié) : prises validées dont l'utilisateur est l'auteur */
    myStats: (id: number) => `/api/competitions/${id}/me/stats`,
    myTeamStats: (id: number) => `/api/competitions/${id}/me/team/stats`,
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

