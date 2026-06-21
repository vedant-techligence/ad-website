import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ---- Token handling ----
let accessToken = null;
let onRefreshFail = () => {};

export const setAccessToken = (token) => {
  accessToken = token;
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
};

export const setOnRefreshFail = (callback) => {
  onRefreshFail = callback;
};

// ---- Request interceptor ----
api.interceptors.request.use((config) => {
  const token = accessToken || localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ---- Response interceptor (auto refresh) ----
let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const { config, response } = err;

    const isAuthEndpoint =
      config?.url?.includes("/auth/login") ||
      config?.url?.includes("/auth/refresh");

    if (response?.status === 401 && !config._retry && !isAuthEndpoint) {
      config._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post("/auth/refresh")
            .then((res) => res.data.accessToken)
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newToken = await refreshPromise;

        setAccessToken(newToken);

        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
      } catch (refreshErr) {
        setAccessToken(null);
        onRefreshFail();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export default api;