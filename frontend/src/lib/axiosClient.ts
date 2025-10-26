import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
});

// Pomocná funkcia – získa access token z localStorage
const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

// Interceptor – pridá Authorization hlavičku
axiosClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor – ak access token expiroval, pokúsi sa získať nový
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ak token expiroval (401) a ešte sme neskúšali refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        console.warn("❌ Missing refresh token, logging out.");
        localStorage.removeItem("access_token");
        return Promise.reject(error);
      }

      try {
        // Poslanie refresh request
        const res = await axios.post(`${baseURL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccess = res.data.access;
        if (newAccess) {
          localStorage.setItem("access_token", newAccess);
          // Zopakovanie povodného requestu s novým tokenom
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
