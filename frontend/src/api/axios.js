import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

let accessToken = null;
let onRefreshFail = () => {};

export const setAccessToken = (token) => {
  accessToken = token;
};

export const setOnRefreshFail = (callback) => {
  onRefreshFail = callback;
};

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

API.interceptors.response.use(
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
          refreshPromise = API.post("/auth/refresh")
            .then((res) => res.data.accessToken)
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newToken = await refreshPromise;
        setAccessToken(newToken);
        config.headers.Authorization = `Bearer ${newToken}`;
        return API(config);
      } catch (refreshErr) {
        setAccessToken(null);
        onRefreshFail();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  },
);

export default API;