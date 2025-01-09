const API_BASE_URL = "https://127.0.0.1:8000";

export const ApiService = {
  async request(method, endpoint, data = null) {
    const apiEndpoint = `${API_BASE_URL}${endpoint}`;
    console.log(`Sending request to: ${apiEndpoint}`);

    try {
      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };

      if (data && method !== "GET") {
        options.body = JSON.stringify(data);
      }

      console.log("Request options:", options);
      const response = await fetch(apiEndpoint, options);
      console.log("Response status:", response.status);

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        console.log("Response content-type:", contentType);
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.log("Error data:", errorData);
          throw new Error(errorData.message || `Erreur ${response.status}`);
        } else {
          throw new Error(`Erreur ${response.status}`);
        }
      }
      const responseData = await response.json();
      console.log("Response data:", responseData);

      return responseData;
    } catch (error) {
      console.error("Request error:", error);
      throw error;
    }
  },

  // Méthodes génériques CRUD
  get(endpoint) {
    return this.request("GET", endpoint);
  },

  post(endpoint, data) {
    return this.request("POST", endpoint, data);
  },

  put(endpoint, data) {
    return this.request("PUT", endpoint, data);
  },

  patch(endpoint, data) {
    return this.request("PATCH", endpoint, data);
  },

  delete(endpoint) {
    return this.request("DELETE", endpoint);
  },
};

export const api = ApiService;
