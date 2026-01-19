import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Notification {
  id: number;
  type: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
}

export const notificationService = {
  getAll: async (): Promise<NotificationResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.notifications.list);
    return response.data;
  },

  getUnread: async (): Promise<NotificationResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.notifications.unread);
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.notifications.count);
      return response.data.unreadCount || 0;
    } catch (error) {
      console.error('Error fetching notification count:', error);
      return 0;
    }
  },

  markAsRead: async (notificationId: number): Promise<any> => {
    const response = await apiClient.put(API_ENDPOINTS.notifications.markRead(notificationId));
    return response.data;
  },

  markAllAsRead: async (): Promise<any> => {
    const response = await apiClient.put(API_ENDPOINTS.notifications.markAllRead);
    return response.data;
  },
};
