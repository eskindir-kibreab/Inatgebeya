import api from "./axios";

export const areasAPI = {
  // Get all areas (public)
  getAll: (params = {}) => api.get("/areas", { params }),

  // Get area by ID (public)
  getById: (id) => api.get(`/areas/${id}`),

  // Create area (admin)
  create: (data) => api.post("/areas", data),

  // Update area (admin)
  update: (id, data) => api.put(`/areas/${id}`, data),

  // Delete area (admin)
  delete: (id) => api.delete(`/areas/${id}`),
};
