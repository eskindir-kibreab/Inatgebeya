import api from "./axios";

export const categoriesAPI = {
  // Get all categories (public)
  getAll: (params = {}) => api.get("/categories", { params }),

  // Get category by ID (public)
  getById: (id) => api.get(`/categories/${id}`),

  // Create category (item_adder_admin)
  create: (data) => api.post("/categories", data),

  // Update category (item_adder_admin)
  update: (id, data) => api.put(`/categories/${id}`, data),

  // Delete category (admin)
  delete: (id) => api.delete(`/categories/${id}`),
};
