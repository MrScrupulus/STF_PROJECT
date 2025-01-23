const API_URL = "https://localhost:8000";

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
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        headers,
        credentials: "include",
        mode: "cors",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  },
  post: async (endpoint, data) => {
    try {
      console.log("Sending request to:", API_URL + endpoint);
      console.log("Request data:", data);

      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers,
        credentials: "include",
        mode: "cors",
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
        credentials: "include",
        mode: "cors",
        body: data ? JSON.stringify(data) : null,
      });

      const responseData = await response.json();
      console.log("Response status:", response.status);
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
  delete: async (endpoint) => {
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
        method: "DELETE",
        headers,
        credentials: "include",
        mode: "cors",
      });

      const responseData = await response.json();
      console.log("Response status:", response.status);
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
};
