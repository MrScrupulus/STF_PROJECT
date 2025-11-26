import apiClient from './api';
import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS } from '../config/api';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  birthDate: string;
  country?: string;
  subscriber_number?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authService = {
  async register(userData: RegisterData) {
    // Validation côté client
    if (!EMAIL_REGEX.test(userData.email)) {
      throw new Error("Format d'email invalide");
    }

    if (!PASSWORD_REGEX.test(userData.password)) {
      throw new Error(
        "Le mot de passe doit contenir au moins une lettre, un chiffre et un caractère spécial"
      );
    }

    if (!PHONE_REGEX.test(userData.phoneNumber)) {
      throw new Error("Le numéro de téléphone doit contenir 10 chiffres");
    }

    // Formatage des données pour l'API
    const formattedData = {
      email: userData.email,
      password: userData.password,
      firstname: userData.firstName,
      lastname: userData.lastName,
      phone_number: userData.phoneNumber.replace(/\D/g, ''),
      birthdate: userData.birthDate,
      country: userData.country,
      subscriber_number: userData.subscriber_number,
    };

    const response = await apiClient.post(API_ENDPOINTS.auth.register, formattedData);
    return response.data;
  },

  async login(credentials: LoginCredentials) {
    const response = await apiClient.post(API_ENDPOINTS.auth.login, credentials);
    
    if (response.data.token) {
      await SecureStore.setItemAsync('jwtToken', response.data.token);
    }
    if (response.data.refresh_token) {
      await SecureStore.setItemAsync('refreshToken', response.data.refresh_token);
    }
    
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await apiClient.get(API_ENDPOINTS.auth.verifyEmail(token));
    return response.data;
  },

  async getMe() {
    const response = await apiClient.get(API_ENDPOINTS.auth.me);
    return response.data;
  },

  async refreshToken() {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post(API_ENDPOINTS.auth.refresh, {
      refresh_token: refreshToken,
    });

    if (response.data.token) {
      await SecureStore.setItemAsync('jwtToken', response.data.token);
    }

    return response.data;
  },

  async logout() {
    await SecureStore.deleteItemAsync('jwtToken');
    await SecureStore.deleteItemAsync('refreshToken');
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('jwtToken');
    return !!token;
  },
};

