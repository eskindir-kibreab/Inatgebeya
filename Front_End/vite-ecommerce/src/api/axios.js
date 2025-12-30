import axios from "axios";
import toast from "react-hot-toast";

// Use the backend IP as fallback
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://10.198.75.102:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // important for JWT cookies
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || "An error occurred";

    if (error.response?.status === 401) {
      sessionStorage.removeItem("token");
      window.location.href = "/login";
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
