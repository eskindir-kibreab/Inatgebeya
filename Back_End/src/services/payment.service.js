import pool from "../config/db.js";
import { WalletService } from "./wallet.service.js";

export class PaymentService {
    /**
     * Initialize payment with Chapa
     */
    static async initializePayment(orderData, customerData) {
        const chapaUrl = "https://api.chapa.co/v1/transaction/initialize";
        const chapaKey = process.env.CHAPA_SECRET_KEY;

        if (!chapaKey) {
            throw new Error("CHAPA_SECRET_KEY is not configured");
        }

        if (orderData.payment_status === 'paid') {
            throw new Error("Order has already been paid.");
        }

        const tx_ref = `TX-${orderData.order_id}-${Date.now()}`;

        const payload = {
            amount: orderData.total,
            currency: "ETB",
            email: customerData.email,
            first_name: customerData.full_name?.split(" ")[0] || "Customer",
            last_name: customerData.full_name?.split(" ").slice(1).join(" ") || "User",
            tx_ref: tx_ref,
            callback_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/verify/webhook`,
            return_url: `${process.env.FRONTEND_URL}/checkout/success?tx_ref=${tx_ref}`,
            "customization[title]": "Order Payment",
            "customization[description]": `Payment for Order #${orderData.order_id}`
        };

        console.log("Chapa Initialization Payload:", {
            return_url: payload.return_url,
            callback_url: payload.callback_url
        });

        const response = await fetch(chapaUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${chapaKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("Chapa Initialize Response:", JSON.stringify(result, null, 2));

        if (result.status !== "success") {
            const errorMessage = typeof result.message === 'object'
                ? JSON.stringify(result.message)
                : result.message || "Chapa initialization failed";
            throw new Error(errorMessage);
        }

        // Save payment record as pending
        await pool.query(
            `INSERT INTO Payments (order_id, user_id, tx_ref, amount, status) 
       VALUES (?, ?, ?, ?, 'pending')`,
            [orderData.order_id, orderData.user_id, payload.tx_ref, orderData.total]
        );

        return {
            checkout_url: result.data.checkout_url,
            tx_ref: payload.tx_ref
        };
    }

    /**
     * Verify Chapa transaction
     */
    static async verifyPayment(tx_ref) {
        const chapaUrl = `https://api.chapa.co/v1/transaction/verify/${tx_ref}`;
        const chapaKey = process.env.CHAPA_SECRET_KEY;

        const response = await fetch(chapaUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${chapaKey}`
            }
        });

        const result = await response.json();

        if (result.status === "success" && result.data.status === "success") {
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // Update payment record
                await connection.query(
                    `UPDATE Payments 
           SET status = 'completed', chapa_reference = ?, paid_at = CURRENT_TIMESTAMP 
           WHERE tx_ref = ?`,
                    [result.data.reference, tx_ref]
                );

                // Update order status
                const [payment] = await connection.query(
                    "SELECT order_id FROM Payments WHERE tx_ref = ?",
                    [tx_ref]
                );

                if (payment.length > 0) {
                    const orderId = payment[0].order_id;
                    await connection.query(
                        "UPDATE Orders SET payment_status = 'paid' WHERE order_id = ?",
                        [orderId]
                    );

                    // NOTE: Wallet Transaction recording moved to OrderService.updateOrderStatus
                }

                await connection.commit();
                return { success: true, orderId: payment[0].order_id };
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        }

        return { success: false };
    }
}
