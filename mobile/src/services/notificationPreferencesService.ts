import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export interface NotificationPreferences {
  expoPushToken?: string | null;
  catchValidated: boolean;
  catchRejected: boolean;
  teamInvitation: boolean;
  competitionRegistered: boolean;
  competitionStarted: boolean;
  competitionEnded: boolean;
  competitionPaused: boolean;
  competitionResumed: boolean;
  catchPending: boolean;
  receiveEmailNotifications: boolean;
}

export interface NotificationPreferencesResponse {
  success: boolean;
  preferences: NotificationPreferences;
}

export const notificationPreferencesService = {
  get: async (): Promise<NotificationPreferencesResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.notificationPreferences.get);
    return response.data;
  },

  update: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferencesResponse> => {
    const response = await apiClient.put(API_ENDPOINTS.notificationPreferences.update, preferences);
    return response.data;
  },
};
