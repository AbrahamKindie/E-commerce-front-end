
import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// A separate Axios request prevents the refresh call from
// passing through this instance's response interceptor.
let refreshPromise = null;

const clearSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  window.dispatchEvent(new Event("auth:session-expired"));
};

// Attach the current access token to every request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired access tokens.
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Never refresh these authentication requests.
    const excludedUrls = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh-token",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/logout",
    ];

    const isExcludedRequest = excludedUrls.some((url) =>
      originalRequest.url?.includes(url)
    );

    if (isExcludedRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      clearSession();
      return Promise.reject(error);
    }

    try {
      // Reuse an existing refresh request if one is already running.
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          })
          .then((response) => {
            const newAccessToken = response.data.accessToken;

            if (!newAccessToken) {
              throw new Error("No access token returned by server");
            }

            localStorage.setItem("accessToken", newAccessToken);

            return newAccessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;

      // Retry the original request with the new access token.
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearSession();
      return Promise.reject(refreshError);
    }
  }
);

export default api;
