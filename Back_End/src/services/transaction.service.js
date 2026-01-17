import pool from "../config/db.js";

export class TransactionService {
    /**
     * Get transaction history for a user (Customer)
     */
    static async getUserTransactions(userId) {
        // Includes Chapa payments and approved Bank transfers
        const [transactions] = await pool.query(
            `SELECT 
                payment_id as id,
                'payment' as type,
                amount,
                currency,
                status,
                payment_method,
                tx_ref,
                paid_at as date,
                'Order Payment' as description
             FROM Payments 
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );
        return transactions;
    }

    /**
     * Get transaction history for a shop owner
     */
    static async getShopTransactions(shopId) {
        const [transactions] = await pool.query(
            `SELECT 
                transaction_id as id,
                type,
                amount,
                source,
                reference_id,
                description,
                created_at as date
             FROM WalletTransactions 
             WHERE wallet_id = (SELECT wallet_id FROM SellerWallets WHERE shop_id = ?)
             ORDER BY created_at DESC`,
            [shopId]
        );
        return transactions;
    }

    /**
     * Get all transactions for Admin
     */
    static async getAllTransactions() {
        const [transactions] = await pool.query(
            `(SELECT 
                p.payment_id as id,
                'payment' COLLATE utf8mb4_general_ci as type,
                p.amount,
                p.currency,
                p.status,
                p.payment_method,
                p.tx_ref,
                p.paid_at as date,
                u.full_name as actor,
                'Order Payment' COLLATE utf8mb4_general_ci as description,
                p.payment_method as source
             FROM Payments p
             JOIN Users u ON p.user_id = u.user_id)
             UNION ALL
             (SELECT 
                wt.transaction_id as id,
                wt.type,
                wt.amount,
                'ETB' COLLATE utf8mb4_general_ci as currency,
                'completed' COLLATE utf8mb4_general_ci as status,
                wt.source as payment_method,
                CAST(wt.reference_id AS CHAR) COLLATE utf8mb4_general_ci as tx_ref,
                wt.created_at as date,
                s.shop_name as actor,
                wt.description,
                wt.source
             FROM WalletTransactions wt
             JOIN SellerWallets sw ON wt.wallet_id = sw.wallet_id
             JOIN Shops s ON sw.shop_id = s.shop_id)
             ORDER BY date DESC`
        );
        return transactions;
    }
}
