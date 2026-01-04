import express from "express";
import { initializePayment, verifyPayment, handleWebhook } from "../controllers/payment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/initialize/:order_id", authMiddleware, initializePayment);
router.get("/verify", authMiddleware, verifyPayment);

router.post("/verify/webhook", handleWebhook);
router.get("/verify/webhook", handleWebhook);

export default router;
