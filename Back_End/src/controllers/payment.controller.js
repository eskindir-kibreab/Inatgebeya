import { PaymentService } from "../services/payment.service.js";
import { OrderService } from "../services/order.service.js";
import { UserService } from "../services/user.service.js";

export const initializePayment = async (req, res) => {
    try {
        const { order_id } = req.params;
        const user_id = req.user.user_id;

        // 1. Get order details
        const order = await OrderService.getOrderById(order_id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.user_id !== user_id) {
            return res.status(403).json({ success: false, message: "Unauthorized access to order" });
        }

        // 2. Get customer details
        const user = await UserService.getUserById(user_id);

        // 3. Initialize Chapa payment
        const paymentData = await PaymentService.initializePayment(order, user);

        res.status(200).json({
            success: true,
            data: paymentData
        });
    } catch (error) {
        console.error("Payment initialization error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { tx_ref } = req.query;
        if (!tx_ref) {
            return res.status(400).json({ success: false, message: "Transaction reference is required" });
        }

        const verificationResult = await PaymentService.verifyPayment(tx_ref);

        if (verificationResult.success) {
            res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                orderId: verificationResult.orderId
            });
        } else {
            res.status(400).json({ success: false, message: "Payment verification failed" });
        }
    } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const handleWebhook = async (req, res) => {
    try {
        // Chapa sends data in body (POST) or sometimes requires GET verification
        // Check both body (POST) and query (GET/JSONP)
        const tx_ref = req.body?.tx_ref || req.query?.tx_ref || req.query?.trx_ref;

        console.log("Chapa Webhook Received:", {
            method: req.method,
            body: req.body,
            query: req.query,
            tx_ref
        });

        if (!tx_ref) {
            console.log("Webhook ignored: No tx_ref found");
            // Return 200 to acknowledge receipt even if we can't process it
            return res.status(200).send("No tx_ref");
        }

        // Verify the payment
        await PaymentService.verifyPayment(tx_ref);

        // Always return 200 to Chapa to acknowledge receipt
        res.status(200).send("Webhook received");
    } catch (error) {
        console.error("Webhook processing error:", error);
        // Still return 200 to prevent Chapa from retrying endlessly if it's a logic error
        res.status(200).send("Webhook error logged");
    }
};
