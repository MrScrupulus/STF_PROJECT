import { api } from "./api";

export const adminService = {
  getUsers: async () => {
    try {
      const response = await api.get("/admin/users");
      return response.users;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  getTeams: async () => {
    try {
      const response = await api.get("/admin/teams");
      return response.teams || [];
    } catch (error) {
      console.error("Error fetching teams:", error);
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return response.user;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  toggleUserRole: async (userId) => {
    try {
      const response = await api.put(`/admin/users/${userId}/toggle-role`);
      return response;
    } catch (error) {
      console.error("Error toggling user role:", error);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  verifyUser: async (userId) => {
    try {
      const response = await api.put(`/admin/users/${userId}/verify`);
      return response;
    } catch (error) {
      console.error("Error verifying user:", error);
      throw error;
    }
  },
};
