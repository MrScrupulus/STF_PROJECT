import api from "./api";

export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      console.log("Response:", response);
      if (response?.success && response?.data?.token) {
        localStorage.setItem("token", response.data.token);
        window.location.href = "/";
        return response.data;
      }
      throw new Error(response.message || "Token non reçu");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      console.log("Register response:", response);
      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Erreur lors de l'inscription");
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await api.post(`/auth/verify-email/${token}`);
      if (response.success) {
        return response;
      }
      throw new Error(
        response.message || "Erreur lors de la vérification de l'email"
      );
    } catch (error) {
      console.error("Email verification error:", error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await api.get("/auth/me");
      return response.user;
    } catch (error) {
      console.error("Error getting current user:", error);
      throw error;
    }
  },

  isAuthenticated: () => {
    const token = localStorage.getItem("token");
    return !!token;
  },

  logout: () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  },
};
