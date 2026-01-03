import api from "./axios";

export const usersAPI = {
  // Get current user profile
  getMyProfile: () => api.get("/users/profile"),

  // Update profile
  updateProfile: (data) => api.put("/users/profile", data),

  // Admin endpoints
  getAllUsers: (params) => api.get("/users", { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post("/users", data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updateUserRole: (id, roleName) =>
    api.put(`/users/${id}/role`, { role_name: roleName }),

  // Change password
  changePassword: (data) => api.put("/users/profile/password", data),
};
