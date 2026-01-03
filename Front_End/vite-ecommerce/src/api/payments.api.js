import axiosInstance from "./axios";

export const paymentsAPI = {
    /**
     * Initialize payment for an order
     * @param {string|number} orderId 
     */
    initialize: (orderId) => axiosInstance.post(`/payments/initialize/${orderId}`),

    /**
     * Verify payment status
     * @param {string} tx_ref 
     */
    verify: (tx_ref) => axiosInstance.get(`/payments/verify`, {
        params: { tx_ref }
    }),
};
