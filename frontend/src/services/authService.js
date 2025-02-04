import { api } from "./api";

export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      if (response.token) {
        localStorage.setItem("token", response.token);

        // Récupérer les informations de l'utilisateur
        const userData = await authService.getCurrentUser();

        // Redirection basée sur le rôle
        if (userData.user.roles?.includes("ROLE_ADMIN")) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/"; // Redirection vers l'accueil pour les utilisateurs normaux
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const transformedData = {
        firstname: userData.firstName,
        lastname: userData.lastName,
        email: userData.email,
        password: userData.password,
        phone_number: userData.phone_number,
        birth_date: userData.birth_date
          ? new Date(userData.birth_date).toISOString().split("T")[0]
          : null,
        country: userData.country,
        subscriber_number: userData.subscriber_number,
      };

      console.log("Données transformées:", transformedData);
      return await api.post("/auth/register", transformedData);
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await api.post(`/auth/verify-email/${token}`, {});
      return response;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'email:", error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get("/auth/me");
      console.log("Auth service response:", response); // Pour déboguer
      return response; // Devrait retourner { success: true, user: {...} }
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

  requestPasswordReset: async (email) => {
    try {
      const response = await api.post("/password-reset/request", { email });
      return response;
    } catch (error) {
      console.error("Password reset request error:", error);
      throw error;
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post("/password-reset/reset", {
        token,
        password: newPassword,
      });
      return response;
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  },

  verifyUserByAdmin: async (userId) => {
    try {
      const response = await api.post(`/auth/admin/verify-user/${userId}`);
      return response;
    } catch (error) {
      console.error("Error verifying user:", error);
      throw error;
    }
  },
};
