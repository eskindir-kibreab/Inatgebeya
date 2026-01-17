import pool from "../config/db.js";

export class ChatService {
    // Send a new message
    static async sendMessage(senderId, receiverId, shopId, message, orderId = null, productId = null) {
        const [result] = await pool.query(
            `INSERT INTO Messages (sender_id, receiver_id, shop_id, order_id, product_id, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [senderId, receiverId, shopId, orderId, productId, message]
        );

        const messageId = result.insertId;

        // Get the full message object to return
        const [messages] = await pool.query(
            `SELECT m.*, 
              sender.full_name as sender_name,
              receiver.full_name as receiver_name
       FROM Messages m
       JOIN Users sender ON m.sender_id = sender.user_id
       JOIN Users receiver ON m.receiver_id = receiver.user_id
       WHERE m.message_id = ?`,
            [messageId]
        );

        return messages[0];
    }

    // Get conversation between user and shop owner for a specific shop
    static async getConversation(userId, shopId) {
        // First get the shop owner id
        const [shops] = await pool.query(
            "SELECT owner_id FROM Shops WHERE shop_id = ?",
            [shopId]
        );

        if (shops.length === 0) {
            return [];
        }

        const shopOwnerId = shops[0].owner_id;

        // Get messages between this user and shop owner for this shop
        const [messages] = await pool.query(
            `SELECT m.*, 
              sender.full_name as sender_name,
              receiver.full_name as receiver_name
       FROM Messages m
       JOIN Users sender ON m.sender_id = sender.user_id
       JOIN Users receiver ON m.receiver_id = receiver.user_id
       WHERE m.shop_id = ? 
         AND (m.sender_id = ? OR m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
            [shopId, userId, userId]
        );

        return messages;
    }

    // Get all conversations for a user (grouped by shop)
    static async getUserConversations(userId) {
        const [conversations] = await pool.query(
            `SELECT 
        m.shop_id,
        s.shop_name,
        s.owner_id as shop_owner_id,
        owner.full_name as shop_owner_name,
        MAX(m.created_at) as last_message_at,
        (SELECT message FROM Messages 
         WHERE shop_id = m.shop_id 
           AND (sender_id = ? OR receiver_id = ?)
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM Messages 
         WHERE shop_id = m.shop_id 
           AND receiver_id = ? 
           AND is_read = FALSE) as unread_count
       FROM Messages m
       JOIN Shops s ON m.shop_id = s.shop_id
       JOIN Users owner ON s.owner_id = owner.user_id
       WHERE m.sender_id = ? OR m.receiver_id = ?
       GROUP BY m.shop_id, s.shop_name, s.owner_id, owner.full_name
       ORDER BY last_message_at DESC`,
            [userId, userId, userId, userId, userId]
        );

        return conversations;
    }

    // Get all conversations for a shop owner (grouped by customer)
    static async getShopConversations(shopId) {
        const [conversations] = await pool.query(
            `SELECT 
        m.shop_id,
        CASE 
          WHEN m.sender_id != s.owner_id THEN m.sender_id 
          ELSE m.receiver_id 
        END as customer_id,
        u.full_name as customer_name,
        u.email as customer_email,
        MAX(m.created_at) as last_message_at,
        (SELECT message FROM Messages 
         WHERE shop_id = m.shop_id 
           AND (sender_id = u.user_id OR receiver_id = u.user_id)
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM Messages 
         WHERE shop_id = m.shop_id 
           AND sender_id = u.user_id 
           AND is_read = FALSE) as unread_count
       FROM Messages m
       JOIN Shops s ON m.shop_id = s.shop_id
       JOIN Users u ON (
         CASE 
           WHEN m.sender_id != s.owner_id THEN m.sender_id 
           ELSE m.receiver_id 
         END = u.user_id
       )
       WHERE m.shop_id = ?
       GROUP BY m.shop_id, customer_id, u.full_name, u.email
       ORDER BY last_message_at DESC`,
            [shopId]
        );

        return conversations;
    }

    // Get conversation between shop owner and specific customer
    static async getShopCustomerConversation(shopId, customerId) {
        const [messages] = await pool.query(
            `SELECT m.*, 
              sender.full_name as sender_name,
              receiver.full_name as receiver_name
       FROM Messages m
       JOIN Users sender ON m.sender_id = sender.user_id
       JOIN Users receiver ON m.receiver_id = receiver.user_id
       WHERE m.shop_id = ? 
         AND (m.sender_id = ? OR m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
            [shopId, customerId, customerId]
        );

        return messages;
    }

    // Mark messages as read
    static async markAsRead(shopId, userId) {
        const [result] = await pool.query(
            `UPDATE Messages 
       SET is_read = TRUE 
       WHERE shop_id = ? AND receiver_id = ? AND is_read = FALSE`,
            [shopId, userId]
        );

        return result.affectedRows;
    }

    // Get shop owner id by shop id
    static async getShopOwnerId(shopId) {
        const [shops] = await pool.query(
            "SELECT owner_id FROM Shops WHERE shop_id = ?",
            [shopId]
        );

        return shops.length > 0 ? shops[0].owner_id : null;
    }

    // Get unread message count for user
    static async getUnreadCount(userId) {
        const [result] = await pool.query(
            "SELECT COUNT(*) as count FROM Messages WHERE receiver_id = ? AND is_read = FALSE",
            [userId]
        );

        return result[0].count;
    }
}
