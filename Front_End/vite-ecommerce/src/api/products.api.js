import api from "./axios";

export const productsAPI = {
  // Get all products (public)
  getAll: (params) => api.get("/products", { params }),

  // Search products (public)
  search: (query, params) =>
    api.get("/products/search", { params: { q: query, ...params } }),

  // Get product by ID (public)
  getById: (id) => api.get(`/products/${id}`),

  // Get product sizes (public)
  getSizes: (id) => api.get(`/products/${id}/sizes`),

  // Rate product (user)
  rate: (id, data) => api.post(`/products/${id}/rate`, data),

  // Toggle product active status
  toggleStatus: (id, data) => api.put(`/products/${id}/toggle`, data),

  // Create product (item_adder_admin)
  create: (formData) => {
    return api.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Add product image (item_adder_admin)
  addImage: (id, formData) => {
    return api.post(`/products/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Add product size (item_adder_admin)
  addSize: (id, data) => api.post(`/products/${id}/sizes`, data),

  // Update stock (item_adder_admin)
  updateStock: (id, data) => api.put(`/products/${id}/stock`, data),

  // Update product
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/products/${id}`, data);
    }
    return api.put(`/products/${id}`, data);
  },

  // Delete product (admin)
  delete: (id) => api.delete(`/products/${id}`),
};
