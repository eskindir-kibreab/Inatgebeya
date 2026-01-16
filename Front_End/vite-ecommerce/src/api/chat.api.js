import api from "./axios";

export const chatAPI = {
    // Send a message
    send: (data) => api.post("/chat/send", data),

    // Get conversation with a specific shop
    getConversation: (shopId) => api.get(`/chat/conversation/${shopId}`),

    // Get all conversations for current user
    getConversations: () => api.get("/chat/conversations"),

    // Get unread message count
    getUnreadCount: () => api.get("/chat/unread-count"),

    // Shop owner: Get all conversations for shop
    getShopConversations: (shopId) => api.get(`/chat/shop/${shopId}/conversations`),

    // Shop owner: Get conversation with specific customer
    getCustomerConversation: (shopId, customerId) =>
        api.get(`/chat/shop/${shopId}/customer/${customerId}`),
};
