import { TransactionService } from "../services/transaction.service.js";
import { WalletService } from "../services/wallet.service.js";

export const getMyTransactions = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const role = req.user.role_name;

        let transactions = [];

        if (role === 'user') {
            transactions = await TransactionService.getUserTransactions(userId);
        } else if (role === 'shop_owner') {
            const wallet = await WalletService.getWalletByOwnerId(userId);
            if (wallet) {
                transactions = await TransactionService.getShopTransactions(wallet.shop_id);
            }
        } else if (['admin', 'super_admin'].includes(role)) {
            transactions = await TransactionService.getAllTransactions();
        }

        res.status(200).json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error("Get Transactions Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
