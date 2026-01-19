import { api } from "./api";

export const notificationService = {
  /**
   * Récupère toutes les notifications de l'utilisateur
   */
  getAll: async () => {
    try {
      const response = await api.get("/api/notifications");
      return response;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  /**
   * Récupère uniquement les notifications non lues
   */
  getUnread: async () => {
    try {
      const response = await api.get("/api/notifications/unread");
      return response;
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      throw error;
    }
  },

  /**
   * Récupère le nombre de notifications non lues
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get("/api/notifications/count");
      return response.unreadCount || 0;
    } catch (error) {
      console.error("Error fetching notification count:", error);
      return 0;
    }
  },

  /**
   * Marque une notification comme lue
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/api/notifications/${notificationId}/read`);
      return response;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead: async () => {
    try {
      const response = await api.put("/api/notifications/read-all");
      return response;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },
};
