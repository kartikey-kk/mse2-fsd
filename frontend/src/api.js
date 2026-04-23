const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const getHeaders = (token, isJson = true) => {
  const headers = {};
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
};

export const api = {
  // Auth
  register: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  login: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  // Grievances
  getGrievances: async (token) => {
    const response = await fetch(`${API_BASE_URL}/grievances`, {
      headers: getHeaders(token, false),
    });
    return handleResponse(response);
  },

  getGrievance: async (token, id) => {
    const response = await fetch(`${API_BASE_URL}/grievances/${id}`, {
      headers: getHeaders(token, false),
    });
    return handleResponse(response);
  },

  searchGrievances: async (token, title) => {
    const response = await fetch(
      `${API_BASE_URL}/grievances/search?title=${encodeURIComponent(title)}`,
      { headers: getHeaders(token, false) }
    );
    return handleResponse(response);
  },

  submitGrievance: async (token, payload) => {
    const response = await fetch(`${API_BASE_URL}/grievances`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  updateGrievance: async (token, id, payload) => {
    const response = await fetch(`${API_BASE_URL}/grievances/${id}`, {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  deleteGrievance: async (token, id) => {
    const response = await fetch(`${API_BASE_URL}/grievances/${id}`, {
      method: "DELETE",
      headers: getHeaders(token, false),
    });
    return handleResponse(response);
  },
};
