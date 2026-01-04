import { WalletService } from "../services/wallet.service.js";
import { ShopService } from "../services/shop.service.js";

export const getMyWallet = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        let wallet;

        if (req.user.role_name === "shop_owner") {
            wallet = await WalletService.getWalletByOwnerId(user_id);
        } else {
            return res.status(403).json({ success: false, message: "Only sellers have wallets" });
        }

        if (!wallet) {
            return res.status(404).json({ success: false, message: "Wallet not found" });
        }

        res.status(200).json({
            success: true,
            data: wallet
        });
    } catch (error) {
        console.error("Get wallet error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch wallet info" });
    }
};

export const getPlatformFinancials = async (req, res) => {
    try {
        // Only Admin can see platform-wide financials
        if (req.user.role_name !== "admin" && req.user.role_name !== "super_admin") {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const summary = await WalletService.getPlatformSummary();
        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error("Platform financials error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch platform financials" });
    }
};
