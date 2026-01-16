import { ChatService } from "../services/chat.service.js";

export class ChatController {
    // Send a message
    static async sendMessage(req, res) {
        try {
            const senderId = req.user.user_id;
            const { shopId, message, orderId, productId } = req.body;

            if (!shopId || !message) {
                return res.status(400).json({
                    success: false,
                    message: "Shop ID and message are required"
                });
            }

            // Get the shop owner ID
            const receiverId = await ChatService.getShopOwnerId(shopId);

            if (!receiverId) {
                return res.status(404).json({
                    success: false,
                    message: "Shop not found"
                });
            }

            // If sender is the shop owner, find the receiver from the conversation context
            let finalReceiverId = receiverId;
            let finalSenderId = senderId;

            if (senderId === receiverId || req.user.role_name === 'admin' || req.user.role_name === 'super_admin') {
                // Shop owner or admin is replying - get customer ID from request
                const { customerId } = req.body;
                if (customerId) {
                    finalReceiverId = customerId;
                }
                // If no customerId, assume standard "User Chat" (Self-message for testing)
                // finalReceiverId remains = receiverId (which is the shop owner/sender themselves)
            }

            const messageId = await ChatService.sendMessage(
                finalSenderId,
                finalReceiverId,
                shopId,
                message,
                orderId || null,
                productId || null
            );

            res.status(201).json({
                success: true,
                message: "Message sent successfully",
                data: { messageId }
            });
        } catch (error) {
            console.error("Send message error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to send message"
            });
        }
    }

    // Get conversation with a shop (for users)
    static async getConversation(req, res) {
        try {
            const userId = req.user.user_id;
            const { shopId } = req.params;

            const messages = await ChatService.getConversation(userId, shopId);

            // Mark messages as read
            await ChatService.markAsRead(shopId, userId);

            res.json({
                success: true,
                data: messages
            });
        } catch (error) {
            console.error("Get conversation error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get conversation"
            });
        }
    }

    // Get all conversations for logged in user
    static async getMyConversations(req, res) {
        try {
            const userId = req.user.user_id;
            const conversations = await ChatService.getUserConversations(userId);

            res.json({
                success: true,
                data: conversations
            });
        } catch (error) {
            console.error("Get conversations error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get conversations"
            });
        }
    }

    // Get all conversations for shop owner's shop
    static async getShopConversations(req, res) {
        try {
            const { shopId } = req.params;
            const conversations = await ChatService.getShopConversations(shopId);

            res.json({
                success: true,
                data: conversations
            });
        } catch (error) {
            console.error("Get shop conversations error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get shop conversations"
            });
        }
    }

    // Get conversation with specific customer (for shop owner)
    static async getCustomerConversation(req, res) {
        try {
            const { shopId, customerId } = req.params;

            const messages = await ChatService.getShopCustomerConversation(shopId, customerId);

            // Mark messages as read for shop owner
            const shopOwnerId = await ChatService.getShopOwnerId(shopId);
            await ChatService.markAsRead(shopId, shopOwnerId);

            res.json({
                success: true,
                data: messages
            });
        } catch (error) {
            console.error("Get customer conversation error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get conversation"
            });
        }
    }

    // Get unread message count
    static async getUnreadCount(req, res) {
        try {
            const userId = req.user.user_id;
            const count = await ChatService.getUnreadCount(userId);

            res.json({
                success: true,
                data: { unreadCount: count }
            });
        } catch (error) {
            console.error("Get unread count error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get unread count"
            });
        }
    }
}
