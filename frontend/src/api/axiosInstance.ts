import axios from "axios";

/**
 * Global API Instance
 * Added interceptor to automatically inject JWT tokens from localStorage.
 */
const api = axios.create({
  baseURL: "http://localhost:3000", 
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST INTERCEPTOR: Runs before every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    // If we have a token, we attach it to the Authorization header
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;