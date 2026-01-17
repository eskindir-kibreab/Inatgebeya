import express from "express";
import { submitBankTransfer, listPendingTransfers, verifyBankTransfer, listHistoricalTransfers } from "../controllers/bankTransfer.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import { uploadSingle, handleUploadError } from "../middlewares/upload.middleware.js";

const router = express.Router();

// User routes
router.post(
    "/submit",
    authMiddleware,
    uploadSingle("receipt"),
    handleUploadError,
    submitBankTransfer
);

// Admin routes
router.get(
    "/pending",
    authMiddleware,
    requireRole("admin", "super_admin"),
    listPendingTransfers
);

router.post(
    "/verify",
    authMiddleware,
    requireRole("admin", "super_admin"),
    verifyBankTransfer
);

router.get(
    "/history",
    authMiddleware,
    requireRole("admin", "super_admin"),
    listHistoricalTransfers
);

export default router;
