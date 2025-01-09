const API_URL = "https://127.0.0.1:8000";

const api = {
  post: async (endpoint, data) => {
    try {
      console.log("Sending request to:", API_URL + endpoint);
      console.log("Request data:", data);

      const response = await fetch(API_URL + endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `Error ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  },

  get: async (endpoint) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(API_URL + endpoint, {
        method: "GET",
        headers,
      });

      // Vérifier si la réponse est du JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("La réponse n'est pas au format JSON");
      }

      const responseData = await response.json();
      console.log("Response status:", response.status);
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `Error ${response.status}`);
      }

      return responseData;
    } catch (error) {
      if (error.message === "La réponse n'est pas au format JSON") {
        // Si le token est invalide, déconnectez l'utilisateur
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      console.error("API error:", error);
      throw error;
    }
  },
};

export default api;
