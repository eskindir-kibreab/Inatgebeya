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
  forgotPassword: (data) => api.post("/auth/forgot-password", data),

  // Verify OTP
  verifyOTP: (data) => api.post("/auth/verify-otp", data),

  // Reset password
  resetPassword: (data) => api.post("/auth/reset-password", data),

  // Resend OTP
  resendOTP: (data) => api.post("/auth/resend-otp", data),
};
