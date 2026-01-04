import pool from "../config/db.js";

export class BankTransferService {
    static async asyncCheckTransactionExists(transactionId) {
        const banks = ['awash', 'cbe', 'birhan'];
        for (const bank of banks) {
            const table = this._getTableName(bank);
            const [existing] = await pool.query(
                `SELECT id FROM ${table} WHERE transaction_id = ? LIMIT 1`,
                [transactionId]
            );
            if (existing.length > 0) return true;
        }
        return false;
    }

    /**
     * Submit a new bank transfer payment
     */
    static async submitPayment(bank, paymentData) {
        const { order_id, user_id, transaction_id, receipt_url, amount } = paymentData;

        // 1. GLOBAL CHECK: Ensure transaction_id is not already in any of the bank tables
        const exists = await this.asyncCheckTransactionExists(transaction_id);
        if (exists) {
            throw new Error("please check payment");
        }

        const table = this._getTableName(bank);
        if (!table) throw new Error("Invalid bank name");

        const [result] = await pool.query(
            `INSERT INTO ${table} (order_id, user_id, transaction_id, receipt_url, amount, status) 
             VALUES (?, ?, ?, ?, ?, 'PENDING')`,
            [order_id, user_id, transaction_id, receipt_url, amount]
        );

        return result.insertId;
    }

    /**
     * Get all pending bank transfers across all banks for admin
     */
    static async getPendingPayments() {
        const banks = ['awash', 'cbe', 'birhan'];
        let allPending = [];

        for (const bank of banks) {
            const table = this._getTableName(bank);
            const [payments] = await pool.query(
                `SELECT p.*, u.full_name as customer_name, o.total as order_total, '${bank}' as bank_type
                 FROM ${table} p
                 JOIN Users u ON p.user_id = u.user_id
                 JOIN Orders o ON p.order_id = o.order_id
                 WHERE p.status = 'PENDING'
                 ORDER BY p.created_at DESC`
            );
            allPending = [...allPending, ...payments];
        }

        return allPending.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    /**
     * Admin Verify (Approve/Reject) a bank transfer
     */
    static async verifyPayment(bank, paymentId, action, adminId, rejectionReason = null) {
        const table = this._getTableName(bank);
        if (!table) throw new Error("Invalid bank name");

        const status = action === 'approve' ? 'APPROVED' : 'REJECTED';

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Get Payment details first
            const [payments] = await connection.query(
                `SELECT * FROM ${table} WHERE id = ?`,
                [paymentId]
            );

            if (payments.length === 0) {
                throw new Error("Payment record not found");
            }
            const payment = payments[0];

            // 2. Update Bank Payment Record Status
            await connection.query(
                `UPDATE ${table} 
                 SET status = ?, 
                     admin_id = ?, 
                     rejection_reason = ?,
                     admin_action_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`,
                [status, adminId, status === 'REJECTED' ? rejectionReason : null, paymentId]
            );

            // 3. Handle Approval/Rejection logic (Update Order and Payments table)
            if (status === 'APPROVED') {
                // Update Order payment_status
                await connection.query(
                    "UPDATE Orders SET payment_status = 'paid' WHERE order_id = ?",
                    [payment.order_id]
                );

                // Insert into main Payments table (Finalizing the transaction)
                const tx_ref = `BANK-${bank.toUpperCase()}-${payment.transaction_id}`;
                await connection.query(
                    `INSERT INTO Payments (order_id, user_id, amount, status, tx_ref, chapa_reference, paid_at) 
                     VALUES (?, ?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP)`,
                    [payment.order_id, payment.user_id, payment.amount, tx_ref, payment.transaction_id]
                );
            } else if (status === 'REJECTED') {
                // Update Order status to 'rejected'
                await connection.query(
                    "UPDATE Orders SET status = 'rejected', payment_status = 'failed' WHERE order_id = ?",
                    [payment.order_id]
                );
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Cancel any pending transfers for an order
     * Useful when order is cancelled by user/admin
     */
    static async cancelPendingTransfer(orderId, connection = null) {
        const conn = connection || pool;
        const banks = ['awash', 'cbe', 'birhan'];

        for (const bank of banks) {
            const table = this._getTableName(bank);
            if (!table) continue;

            await conn.query(
                `UPDATE ${table} SET status = 'CANCELLED' WHERE order_id = ? AND status = 'PENDING'`,
                [orderId]
            );
        }
    }

    /**
     * Helper to get table name from bank key
     */
    static _getTableName(bank) {
        const mapping = {
            'awash': 'awash_bank_payments',
            'cbe': 'cbe_bank_payments',
            'birhan': 'birhan_bank_payments'
        };
        return mapping[bank.toLowerCase()];
    }
}
