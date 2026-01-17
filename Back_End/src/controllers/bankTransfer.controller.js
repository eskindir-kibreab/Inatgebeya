import { BankTransferService } from "../services/bankTransfer.service.js";

// @desc Submit bank transfer payment
// @route POST /api/bank-transfer/submit
// @access Private
export const submitBankTransfer = async (req, res) => {
    try {
        const { bank, order_id, transaction_id, amount } = req.body;
        const user_id = req.user.user_id;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Receipt screenshot is mandatory" });
        }

        // Receipt URL should be the path where multer saved the file
        // Usually req.file.destination + req.file.filename or just the filename if served statically
        const receipt_url = req.file.filename;

        const paymentId = await BankTransferService.submitPayment(bank, {
            order_id,
            user_id,
            transaction_id,
            receipt_url,
            amount
        });

        res.status(201).json({
            success: true,
            message: "Payment submitted successfully and is pending verification.",
            paymentId
        });
    } catch (error) {
        console.error("Bank Transfer Submission Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Admin: List all pending bank transfers
// @route GET /api/bank-transfer/pending
// @access Private/Admin
export const listPendingTransfers = async (req, res) => {
    try {
        const payments = await BankTransferService.getPendingPayments();
        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        console.error("List Pending Transfers Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Admin: Approve or Reject a bank transfer
// @route POST /api/bank-transfer/verify
// @access Private/Admin
export const verifyBankTransfer = async (req, res) => {
    try {
        const { bank, payment_id, action, rejection_reason } = req.body;
        const admin_id = req.user.user_id;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: "Invalid action" });
        }

        await BankTransferService.verifyPayment(bank, payment_id, action, admin_id, rejection_reason);

        res.status(200).json({
            success: true,
            message: `Payment successfully ${action}d`
        });
    } catch (error) {
        console.error("Verify Bank Transfer Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Admin: List all historical bank transfers
// @route GET /api/bank-transfer/history
// @access Private/Admin
export const listHistoricalTransfers = async (req, res) => {
    try {
        const payments = await BankTransferService.getHistoricalPayments();
        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        console.error("List Historical Transfers Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
