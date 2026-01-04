import express from "express";
import { getMyWallet, getPlatformFinancials } from "../controllers/wallet.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/my-wallet", authMiddleware, getMyWallet);
router.get("/platform-summary", authMiddleware, getPlatformFinancials);

export default router;
