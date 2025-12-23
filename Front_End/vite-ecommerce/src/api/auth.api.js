import api from "./axios";

export const authAPI = {
  // Register user
  register: (userData) => api.post("/auth/register", userData),

  // Login user
  login: (credentials) => api.post("/auth/login", credentials),

  // Logout user
  logout: () => api.post("/auth/logout"),

  // Get current user profile
  getProfile: () => api.get("/auth/me"),

  // Forgot password
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),

  // Verify OTP
  verifyOTP: (data) => api.post("/auth/verify-otp", data),

  // Reset password
  resetPassword: (data) => api.post("/auth/reset-password", data),

  // Resend OTP
  resendOTP: (email) => api.post("/auth/resend-otp", { email }),
};
