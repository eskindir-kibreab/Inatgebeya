import api from "./axios";

export const shopsAPI = {
  // Get all shops (public)
  getAll: (params) => api.get("/shops", { params }),

  // Get shop by ID (public)
  getById: (id) => api.get(`/shops/${id}`),

  // Get shop products (public)
  getShopProducts: (id, params) => api.get(`/shops/${id}/products`, { params }),

  // Get my shop (shop_owner)
  getMyShop: () => api.get("/shops/my/shop"),

  // Create shop (admin)
  create: (data) => api.post("/shops", data),

  // Update shop
  update: (id, data) => api.put(`/shops/${id}`, data),

  // Delete shop (admin)
  delete: (id) => api.delete(`/shops/${id}`),

  // Get shop analytics
  getAnalytics: (id) => api.get(`/shops/${id}/analytics`),
};
