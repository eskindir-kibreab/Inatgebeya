import api from "./axios";

export const ordersAPI = {
  // Get my orders (user)
  getMyOrders: (params) => api.get("/orders/my-orders", { params }),

  // Create order (user)
  create: (data) => api.post("/orders", data),

  // Cancel order (user)
  cancel: (id) => api.post(`/orders/${id}/cancel`),

  // Request return (user)
  requestReturn: (data) => api.post("/orders/return", data),

  // Get shop orders (shop_owner)
  getShopOrders: (params) => api.get("/orders/shop-orders", { params }),

  // Update order status (shop_owner)
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),

  // Get all orders (admin)
  getAll: (params) => api.get("/orders", { params }),

  // Get order by ID
  getById: (id) => api.get(`/orders/${id}`),
};
