import axios from "axios";

// When VITE_API_BASE_URL is a relative path like "/api", the Vite dev proxy
// forwards all /api/* requests to the backend (no CORS issues regardless of port).
// For production builds pointing at an absolute URL, it works as before.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api";

// API_ORIGIN is used to prefix relative media URLs (e.g. /uploads/...)
// When the base URL is relative ("/api"), the origin is the current window origin.
// When absolute (e.g. "http://localhost:5000/api"), strip the "/api" suffix.
export const API_ORIGIN = API_BASE_URL.startsWith("http")
  ? API_BASE_URL.replace(/\/api\/?$/, "")
  : "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler — clear session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/signup")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export { api as API };
export default api;
