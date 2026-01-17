import express from "express";
import { getMyTransactions } from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/my", authMiddleware, getMyTransactions);

export default router;
