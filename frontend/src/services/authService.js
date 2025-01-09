import { api } from "./api";

const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;

export const authService = {
  async register(userData) {
    try {
      // Validation côté client
      if (!EMAIL_REGEX.test(userData.email)) {
        throw new Error("Format d'email invalide");
      }

      if (!PASSWORD_REGEX.test(userData.password)) {
        throw new Error(
          "Le mot de passe doit contenir au moins une lettre, un chiffre et un caractère spécial"
        );
      }

      if (!PHONE_REGEX.test(userData.phoneNumber)) {
        throw new Error("Le numéro de téléphone doit contenir 10 chiffres");
      }

      // Formatage des données pour l'API
      const formattedData = {
        email: userData.email,
        password: userData.password,
        firstname: userData.firstName,
        lastname: userData.lastName,
        phone_number: userData.phoneNumber.replace(/\D/g, ""),
        birthdate: userData.birthDate,
        country: userData.country,
        subscriber_number: userData.subscriber_number,
      };

      console.log("Sending registration data:", formattedData);
      const response = await api.post("/api/auth/register", formattedData);

      if (!response.success) {
        throw new Error(response.message || "Erreur lors de l'inscription");
      }

      return response;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  async login(credentials) {
    try {
      const response = await api.post("/api/auth/login", credentials);
      if (response.token) {
        localStorage.setItem("token", response.token);
      }
      return response;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  async verifyEmail(token) {
    try {
      const response = await api.get(`/api/auth/verify-email/${token}`);
      return response;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'email:", error);
      throw error;
    }
  },

  logout() {
    localStorage.removeItem("token");
  },
};
