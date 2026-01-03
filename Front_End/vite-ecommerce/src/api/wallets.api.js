import axiosInstance from "./axios";

export const walletsAPI = {
    /**
     * Get current seller wallet balance and history
     */
    getMyWallet: () => axiosInstance.get("/wallets/my-wallet"),

    /**
     * Get platform-wide financial summary (Admin/SuperAdmin only)
     */
    getPlatformSummary: () => axiosInstance.get("/wallets/platform-summary"),
};
