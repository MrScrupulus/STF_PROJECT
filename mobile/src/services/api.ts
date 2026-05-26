import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';
import { triggerAuthSessionExpired } from '../utils/authSessionEvents';

// En-têtes de base (ngrok-skip-browser-warning évite la page d'avertissement ngrok)
const baseHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
if (API_BASE_URL.includes('ngrok')) {
  baseHeaders['ngrok-skip-browser-warning'] = '1';
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: baseHeaders,
});

/** Chemin relatif uniquement (`/api/...`), sans query string ni baseURL. */
function normalizeRequestPath(url: string | undefined): string {
  if (!url) return '';
  const noQuery = url.split('?')[0];
  if (noQuery.startsWith('http')) {
    try {
      return new URL(noQuery).pathname;
    } catch {
      return '';
    }
  }
  return noQuery.startsWith('/') ? noQuery : `/${noQuery}`;
}

/**
 * Routes publiques sans Bearer — alignées sur frontend/src/services/api.js.
 * Sinon un JWT expiré force un 401 Lexik même pour du GET public et casse la fiche équipe.
 */
function shouldAttachAuthBearer(method: string | undefined, url: string | undefined): boolean {
  const m = (method || 'get').toUpperCase();
  const path = normalizeRequestPath(url);
  if (m === 'GET' && /^\/api\/teams\/\d+$/.test(path)) {
    return false;
  }
  return true;
}

// Intercepteur pour ajouter le token à chaque requête
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('jwtToken');
    if (token && shouldAttachAuthBearer(config.method, config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function isAuthAttempt401(error: AxiosError): boolean {
  const url = error.config?.url ?? '';
  // 401 attendu : mauvais identifiants, pas une session expirée
  if (url.includes('/auth/login') || url.includes('/auth/register')) {
    return true;
  }
  return false;
}

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && !isAuthAttempt401(error)) {
      await SecureStore.deleteItemAsync('jwtToken');
      await SecureStore.deleteItemAsync('refreshToken');
      triggerAuthSessionExpired();
    }
    return Promise.reject(error);
  }
);

export default apiClient;

