import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true, // - CRITICAL: Allows sending/receiving HttpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * REQUEST interceptor
 * REFINEMENT: We no longer manually attach the Authorization header.
 * The browser handles the HttpOnly cookie automatically for us.
 */
api.interceptors.request.use((config) => {
  return config;
});

/**
 * RESPONSE interceptor — handles global 401 (token expired / invalid).
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // We clear user info but the cookie is handled by the browser/server
      localStorage.removeItem('auth_user');
      globalThis.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;