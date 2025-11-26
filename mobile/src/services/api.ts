import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';

// Instance axios configurée
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
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

