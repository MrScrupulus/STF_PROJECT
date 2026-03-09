import { api } from "./api";
import { toast } from "react-hot-toast";

export const authService = {
  login: async (credentials) => {
    try {
      console.group("🔑 Connexion utilisateur");
      console.log("📤 Tentative connexion:", {
        email: credentials.email,
        password: "********",
      });

      const response = await api.post("/api/auth/login", credentials);
      console.log("📥 Réponse connexion:", { ...response, token: "********" });

      if (response.token) {
        localStorage.setItem("token", response.token);
        const userData = await authService.getCurrentUser();
        console.log("👤 Données utilisateur:", userData);

        if (userData.user.roles?.includes("ROLE_ADMIN")) {
          console.log("🎯 Redirection: /dashboard (ADMIN)");
          window.location.href = "/dashboard";
        } else {
          console.log("🎯 Redirection: /competitions (USER)");
          window.location.href = "/competitions";
        }
        console.groupEnd();
        return true;
      }
      console.groupEnd();
      return false;
    } catch (error) {
      console.error("❌ Erreur connexion:", error);
      console.groupEnd();
      
      // Préserver les informations d'erreur du backend pour un meilleur affichage
      if (error.response) {
        // Erreur avec réponse HTTP
        const backendError = new Error(error.response.data?.message || error.message || "Erreur de connexion");
        backendError.response = error.response;
        throw backendError;
      }
      throw error;
    }
  },

  register: async (userData) => {
    try {
      console.group("📝 Inscription utilisateur");
      console.log("📤 Données envoyées:", {
        ...userData,
        password: "********",
      });

      const transformedData = {
        username: userData.username,
        firstname: userData.firstName,
        lastname: userData.lastName,
        email: userData.email,
        password: userData.password,
        ...(userData.phone_number && { phone_number: userData.phone_number }),
      };

      console.log("🔄 Données transformées:", {
        ...transformedData,
        password: "********",
      });

      const response = await api.post("/api/auth/register", transformedData);
      console.log("📥 Réponse serveur:", response);
      console.groupEnd();
      return response;
    } catch (error) {
      console.error("❌ Erreur d'inscription:", error);
      console.groupEnd();
      throw error;
    }
  },

  verifyEmail: async (token) => {
    try {
      console.group("✉️ Vérification email");
      console.log("📤 Token:", token);
      const response = await api.get(`/api/auth/verify-email/${token}`);
      console.log("📥 Réponse:", response);
      console.groupEnd();
      return response;
    } catch (error) {
      console.error("❌ Erreur vérification email:", error);
      console.groupEnd();
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      console.group("👤 Récupération utilisateur courant");
      const response = await api.get("/api/auth/me");
      console.log("📥 Données utilisateur:", response);
      console.groupEnd();
      return response;
    } catch (error) {
      console.error("❌ Erreur récupération utilisateur:", error);
      console.groupEnd();
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
      console.group("🔄 Demande réinitialisation mot de passe");
      console.log("📤 Email:", email);
      const response = await api.post("/password-reset/request", { email });
      console.log("📥 Réponse:", response);
      console.groupEnd();
      return response;
    } catch (error) {
      console.error("❌ Erreur demande réinitialisation:", error);
      console.groupEnd();
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
      const response = await api.post(`/api/auth/admin/verify-user/${userId}`);
      return response;
    } catch (error) {
      console.error("Error verifying user:", error);
      throw error;
    }
  },

  updateProfile: async (userData) => {
    try {
      console.group("✏️ Mise à jour du profil");
      console.log("📤 Données envoyées:", {
        ...userData,
        password: userData.password ? "********" : undefined,
      });

      const transformedData = {
        firstname: userData.firstName,
        lastname: userData.lastName,
        email: userData.email,
        phone_number: userData.phone_number,
      };

      const response = await api.post("/api/auth/profile", transformedData);
      console.log("📥 Réponse serveur:", response);
      console.groupEnd();
      return response;
    } catch (error) {
      console.error("❌ Erreur mise à jour profil:", error);
      console.groupEnd();
      throw error;
    }
  },

  updatePassword: async (currentPassword, newPassword) => {
    try {
      console.group("🔐 Mise à jour du mot de passe");
      const response = await api.put("/api/auth/password", {
        currentPassword,
        newPassword,
      });
      console.log("📥 Réponse serveur:", response);
      console.groupEnd();
      return response;
    } catch (error) {
      console.error("❌ Erreur mise à jour mot de passe:", error);
      console.groupEnd();
      throw error;
    }
  },

  deleteAccount: async () => {
    try {
      console.group("❌ Suppression du compte");
      const response = await api.delete("/users/profile");
      console.log("📥 Réponse serveur:", response);
      console.groupEnd();
      localStorage.removeItem("token");
      toast.success("Votre compte a été supprimé avec succès");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      return response;
    } catch (error) {
      console.error("❌ Erreur suppression compte:", error);
      console.groupEnd();
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.post('/api/auth/token/refresh', {
        refresh_token: localStorage.getItem('refresh_token')
      });
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      // Redirection vers login si refresh échoue
      window.location.href = '/login';
    }
  }
};
