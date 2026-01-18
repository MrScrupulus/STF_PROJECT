const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const getHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

const handleResponse = async (response) => {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  if (!response.ok) {
    let errorMessage;
    try {
      if (isJson) {
        const errorData = await response.json();
        errorMessage = errorData.message || "Une erreur est survenue";
      } else {
        errorMessage = await response.text();
      }
    } catch (e) {
      errorMessage = `Erreur ${response.status}: ${response.statusText}`;
    }

    if (response.status === 401) {
      console.log("401 error:", errorMessage);
      throw { status: 401, message: errorMessage };
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  return isJson ? data : response.text();
};

export const api = {
  get: async (endpoint) => {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (
        !endpoint.includes("/api/auth/login") &&
        !endpoint.includes("/api/auth/register") &&
        !endpoint.includes("/password-reset")
      ) {
        const token = localStorage.getItem("token");
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${API_URL}${endpoint}`, { headers });

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      if (!response.ok) {
        let errorMessage;
        try {
          if (isJson) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || `Error ${response.status}`;
          } else {
            const text = await response.text();
            // Si c'est du HTML (erreur Symfony), extraire le message d'erreur
            if (text.includes('<!DOCTYPE') || text.includes('<html')) {
              // Essayer d'extraire le message d'erreur du HTML
              const match = text.match(/<!--\s*(.*?)\s*-->/);
              if (match) {
                errorMessage = match[1].replace(/&quot;/g, '"');
              } else {
                errorMessage = `Erreur ${response.status}: ${response.statusText}`;
              }
            } else {
              errorMessage = text || `Error ${response.status}: ${response.statusText}`;
            }
          }
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      let responseData;
      try {
        if (isJson) {
          responseData = await response.json();
        } else {
          // Si ce n'est pas du JSON, vérifier que ce n'est pas du HTML
          const text = await response.text();
          if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            throw new Error('Réponse HTML inattendue du serveur');
          }
          responseData = text;
        }
      } catch (e) {
        if (e.message === 'Réponse HTML inattendue du serveur') {
          throw e;
        }
        // Si le parsing JSON échoue, essayer de lire comme texte
        responseData = await response.text();
      }

      return responseData;
    } catch (error) {
      console.error("API error:", error);
      if (error.message === "Expired JWT Token") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      throw error;
    }
  },
  post: async (endpoint, data = {}) => {
    const headers = {
      "Content-Type": "application/json",
    };

    if (!endpoint.startsWith("/password-reset")) {
      const token = localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Error ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  },
  put: async (endpoint, data = null) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(API_URL + endpoint, {
        method: "PUT",
        headers,
        body: data ? JSON.stringify(data) : null,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Error ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  },
  delete: async (endpoint) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };

      const response = await fetch(API_URL + endpoint, {
        method: "DELETE",
        headers,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Error ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  },
  patch: async (endpoint, data = null) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(API_URL + endpoint, {
        method: "PATCH",
        headers,
        body: data ? JSON.stringify(data) : null,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Error ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  },
};
