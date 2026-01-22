import { api } from "./api";

export const notificationPreferencesService = {
  get: async () => {
    try {
      const response = await api.get("/api/notification-preferences");
      return response;
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      throw error;
    }
  },
  update: async (preferences) => {
    try {
      const response = await api.put("/api/notification-preferences", preferences);
      return response;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      throw error;
    }
  },
};
