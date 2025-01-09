import { api } from "./api";
import { ENDPOINTS } from "./endpoints";

export const authService = {
  async register(userData) {
    try {
      const formattedData = {
        email: userData.email,
        password: userData.password,
        firstname: userData.firstName,
        lastname: userData.lastName,
        phone_number: userData.phoneNumber,
        birthdate: userData.birthDate,
        country: userData.country,
        subscriber_number: userData.subscriber_number,
      };

      console.log("Sending registration data:", formattedData);
      const response = await api.post(ENDPOINTS.auth.register, formattedData);
      return response;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post(ENDPOINTS.auth.login, credentials);
      if (response.token) {
        localStorage.setItem("token", response.token);
      }
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Erreur lors de la connexion",
      };
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await api.get(ENDPOINTS.auth.verifyEmail(token));
      return {
        success: true,
        message: response.message || "Email vérifié avec succès",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Erreur lors de la vérification de l'email",
      };
    }
  },

  logout: () => {
    localStorage.removeItem("token");
  },
};
