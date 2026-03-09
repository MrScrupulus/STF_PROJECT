import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';

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

// Intercepteur pour ajouter le token à chaque requête
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      await SecureStore.deleteItemAsync('jwtToken');
      await SecureStore.deleteItemAsync('refreshToken');
      // Rediriger vers login (sera géré par le contexte d'auth)
    }
    return Promise.reject(error);
  }
);

export default apiClient;

