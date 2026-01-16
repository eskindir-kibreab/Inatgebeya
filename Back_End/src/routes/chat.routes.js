import express from "express";
import { ChatController } from "../controllers/chat.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// User routes
router.post("/send", ChatController.sendMessage);
router.get("/conversation/:shopId", ChatController.getConversation);
router.get("/conversations", ChatController.getMyConversations);
router.get("/unread-count", ChatController.getUnreadCount);

// Shop owner routes
router.get(
    "/shop/:shopId/conversations",
    requireRole("shop_owner", "admin", "super_admin"),
    ChatController.getShopConversations
);
router.get(
    "/shop/:shopId/customer/:customerId",
    requireRole("shop_owner", "admin", "super_admin"),
    ChatController.getCustomerConversation
);

export default router;
