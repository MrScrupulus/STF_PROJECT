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
        if (userData.roles?.includes("ROLE_ADMIN")) {
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
      // Transformer les données pour correspondre au format attendu par le backend
      const transformedData = {
        email: userData.email,
        password: userData.password,
        firstname: userData.firstName,
        lastname: userData.lastName,
        phone_number: userData.phoneNumber,
        birthdate: userData.birthDate,
        country: userData.country,
        subscriber_number: userData.subscriber_number,
      };

      const response = await api.post("/auth/register", transformedData);

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
      if (!response.success) {
        throw new Error(
          response.message || "Erreur lors de la récupération de l'utilisateur"
        );
      }
      return response.user;
    } catch (error) {
      if (error.status === 401) {
        // L'utilisateur n'est pas connecté
        return null;
      }
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
