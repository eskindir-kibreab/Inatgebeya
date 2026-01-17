import pool from "../config/db.js";

export class WalletService {
    /**
     * Get shop wallet balance and details
     */
    static async getWalletByShopId(shopId) {
        const [wallets] = await pool.query(
            "SELECT * FROM SellerWallets WHERE shop_id = ?",
            [shopId]
        );
        return wallets.length > 0 ? wallets[0] : null;
    }

    /**
     * Get wallet by owner (User ID)
     */
    static async getWalletByOwnerId(userId) {
        const [wallets] = await pool.query(
            `SELECT sw.*, s.shop_name 
       FROM SellerWallets sw
       JOIN Shops s ON sw.shop_id = s.shop_id
       WHERE s.owner_id = ?`,
            [userId]
        );
        return wallets.length > 0 ? wallets[0] : null;
    }

    /**
     * Get platform financial summary (Admin only)
     */
    static async getPlatformSummary() {
        const [revenue] = await pool.query(
            "SELECT source, SUM(amount) as total FROM PlatformRevenue GROUP BY source"
        );

        const [tax] = await pool.query(
            "SELECT SUM(tax_amount) as total_tax FROM TaxRecords"
        );

        const [escrow] = await pool.query(
            "SELECT SUM(total) as amount FROM Orders WHERE payment_status = 'paid' AND status = 'PAID'"
        );

        return {
            revenue: revenue.reduce((acc, curr) => {
                acc[curr.source] = curr.total;
                return acc;
            }, { commission: 0, gateway_fee: 0 }),
            total_tax: tax[0].total_tax || 0,
            escrow_funds: escrow[0].amount || 0
        };
    }
    /**
     * Record a transaction in the wallet ledger
     */
    static async addTransaction(connection, data) {
        const { wallet_id, amount, type, source, reference_id, description } = data;

        await connection.query(
            `INSERT INTO WalletTransactions (wallet_id, amount, type, source, reference_id, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [wallet_id, amount, type, source, reference_id, description]
        );
    }
}
