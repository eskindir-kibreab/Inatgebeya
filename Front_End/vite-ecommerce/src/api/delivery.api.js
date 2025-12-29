import api from "./axios";

export const deliveryAPI = {
  // Delivery person: Get assigned deliveries
  getAssigned: (params) => api.get("/delivery/assigned", { params }),

  // Delivery person: Get profile
  getProfile: () => api.get("/delivery/profile"),

  // Delivery person: Update delivery status
  updateStatus: (id, data) => api.put(`/delivery/${id}/status`, data),

  // Delivery person: Get delivery history
  getHistory: (params) => api.get("/delivery/history", { params }),

  // Delivery admin: Get delivery persons
  getDeliveryPersons: (params) =>
    api.get("/delivery/delivery-persons", { params }),

  // Delivery admin: Get delivery person by ID
  getDeliveryPerson: (id) => api.get(`/delivery/delivery-persons/${id}`),

  // Delivery admin: Create delivery person
  createDeliveryPerson: (data) => api.post("/delivery/delivery-persons", data),

  // Delivery admin: Update delivery person
  updateDeliveryPerson: (id, data) =>
    api.put(`/delivery/delivery-persons/${id}`, data),

  // Delivery admin: Update delivery person status
  updateDeliveryPersonStatus: (id, data) =>
    api.put(`/delivery/delivery-persons/${id}/status`, data),

  // Delivery admin: Get pending deliveries
  getPending: (params) => api.get("/delivery/pending", { params }),

  // Delivery admin: Assign delivery
  assign: (data) => api.post("/delivery/assign", data),

  // Delivery admin: Get delivery stats
  getStats: (params) => api.get("/delivery/stats", { params }),

  // Delivery admin: Delete delivery person and associated user
  deleteDeliveryPerson: (id) => api.delete(`/delivery/delivery-persons/${id}`),
};
