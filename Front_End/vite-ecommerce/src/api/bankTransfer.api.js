import axiosInstance from "./axios";

export const bankTransferAPI = {
    /**
     * Submit a bank transfer payment
     * @param {FormData} formData - Contains bank, order_id, transaction_id, amount, and receipt file
     */
    submit: (formData) => axiosInstance.post("/bank-transfer/submit", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    }),

    /**
     * Admin: Get pending transfers
     */
    getPending: () => axiosInstance.get("/bank-transfer/pending"),

    /**
     * Admin: Verify transfer
     * @param {Object} data - { bank, payment_id, action }
     */
    verify: (data) => axiosInstance.post("/bank-transfer/verify", data)
};
