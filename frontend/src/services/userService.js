import api from "./api";

export const userService = {
  updateProfile: async (userData) => {
    try {
      const response = await api.put("/users/update/profile", userData);
      return response.user;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  updatePassword: async (currentPassword, newPassword) => {
    try {
      await api.put("/users/update/password", {
        currentPassword,
        newPassword,
      });
      return true;
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  },

  deleteAccount: async () => {
    try {
      await api.delete("/users/profile");
      localStorage.removeItem("token");
      return true;
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  },
};
