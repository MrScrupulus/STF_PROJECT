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

    // Validation du téléphone seulement s'il est fourni
    if (userData.phoneNumber && userData.phoneNumber.trim() !== '') {
      if (!PHONE_REGEX.test(userData.phoneNumber)) {
        throw new Error("Le numéro de téléphone doit contenir 10 chiffres");
      }
    }

    // Formatage des données pour l'API (ne pas envoyer les champs vides)
    const formattedData: any = {
      email: userData.email,
      password: userData.password,
      firstname: userData.firstName,
      lastname: userData.lastName,
    };

    // Ajouter les champs optionnels seulement s'ils sont remplis
    if (userData.phoneNumber && userData.phoneNumber.trim() !== '') {
      formattedData.phone_number = userData.phoneNumber.replace(/\D/g, '');
    }
    if (userData.birthDate && userData.birthDate.trim() !== '') {
      formattedData.birthdate = userData.birthDate;
    }
    if (userData.country && userData.country.trim() !== '') {
      formattedData.country = userData.country;
    }
    if (userData.subscriber_number && userData.subscriber_number.trim() !== '') {
      formattedData.subscriber_number = userData.subscriber_number;
    }

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

  async getCurrentUser() {
    const response = await apiClient.get(API_ENDPOINTS.auth.me);
    return {
      success: true,
      user: response.data.user || response.data,
    };
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

  async deleteAccount(): Promise<void> {
    await apiClient.delete('/api/auth/account');
  },

  async forgotPassword(email: string): Promise<any> {
    const response = await apiClient.post(API_ENDPOINTS.auth.forgotPassword, {
      email: email,
    });
    return response.data;
  },

  async resetPassword(token: string, password: string): Promise<any> {
    const response = await apiClient.post(API_ENDPOINTS.auth.resetPassword, {
      token: token,
      password: password,
    });
    return response.data;
  },

  async updateProfile(profileData: {
    firstname?: string;
    lastname?: string;
    phone_number?: string | null;
    birthdate?: string | null;
    country?: string | null;
    subscriber_number?: string | null;
  }): Promise<any> {
    const response = await apiClient.post(API_ENDPOINTS.auth.updateProfile, profileData);
    return response.data;
  },

  async updatePassword(currentPassword: string, newPassword: string): Promise<any> {
    // Validation côté client
    if (!PASSWORD_REGEX.test(newPassword)) {
      throw new Error(
        "Le mot de passe doit contenir au moins 8 caractères, une lettre, un chiffre et un caractère spécial"
      );
    }

    const response = await apiClient.put(API_ENDPOINTS.auth.updatePassword, {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

