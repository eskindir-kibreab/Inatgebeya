import pool from "../config/db.js";
import { BankTransferService } from "./bankTransfer.service.js";

export class OrderService {
  // Get all orders with filters
  static async getAllOrders(filters = {}, page = 1, limit = 20) {
    const { user_id, shop_id, status, start_date, end_date } = filters;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, u.full_name as customer_name, s.shop_name
      FROM Orders o
      JOIN Users u ON o.user_id = u.user_id
      JOIN Shops s ON o.shop_id = s.shop_id
      WHERE 1=1
    `;
    const params = [];

    if (user_id) {
      query += " AND o.user_id = ?";
      params.push(user_id);
    }

    if (shop_id) {
      query += " AND o.shop_id = ?";
      params.push(shop_id);
    }

    if (status) {
      if (status === 'paid') {
        // Special case: "Paid" filter should show orders that are either status='paid' OR payment_status='paid'
        query += " AND (o.\`status\` = 'paid' OR o.payment_status = 'paid')";
      } else if (status === 'approved') {
        // Map frontend 'approved' to both possible backend values
        query += " AND o.\`status\` IN ('approved', 'ADMIN_APPROVED')";
      } else {
        query += " AND o.\`status\` = ?";
        params.push(status);
      }
    }

    if (start_date) {
      query += " AND DATE(o.created_at) >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND DATE(o.created_at) <= ?";
      params.push(end_date);
    }

    if (filters.search) {
      query += " AND (o.order_id LIKE ? OR u.full_name LIKE ?)";
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // Get total count
    const countQuery = query.replace(
      /SELECT o\.\*, o\.order_id as id, u\.full_name as customer_name, s\.shop_name/,
      "SELECT COUNT(*) as total"
    );
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    query += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [orders] = await pool.query(query, params);

    // Enrich each order with items and bank details
    for (const order of orders) {
      await this._enrichOrderData(order);
    }

    return {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get order by ID
  static async getOrderById(orderId) {
    const [orders] = await pool.query(
      `SELECT o.*, o.order_id as id, u.full_name as customer_name, u.email as customer_email, 
              s.shop_name, s.shop_id, a.area_name
       FROM Orders o
       JOIN Users u ON o.user_id = u.user_id
       JOIN Shops s ON o.shop_id = s.shop_id
       JOIN Areas a ON s.area_id = a.area_id
       WHERE o.order_id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];

    // Get order items and bank details via helper
    await this._enrichOrderData(order);

    // Get delivery info if exists
    const [delivery] = await pool.query(
      `SELECT do.*, dp.delivery_person_id, u.full_name as delivery_person_name
       FROM DeliveryOrders do
       JOIN DeliveryPersons dp ON do.delivery_person_id = dp.delivery_person_id
       JOIN Users u ON dp.user_id = u.user_id
       WHERE do.order_id = ?`,
      [orderId]
    );
    order.delivery = delivery.length > 0 ? delivery[0] : null;

    return order;
  }

  // Create order
  static async createOrder(orderData) {
    const { user_id, shop_id, delivery_address, items, payment_method, transaction_id } = orderData;

    // 1. If it's a bank transfer, check transaction ID BEFORE starting order creation
    if (payment_method === 'bank_transfer') {
      if (!transaction_id) {
        throw new Error("Transaction ID is required for bank transfer");
      }
      const exists = await BankTransferService.asyncCheckTransactionExists(transaction_id);
      if (exists) {
        throw new Error("please check payment");
      }
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Calculation constants
      const TAX_RATE = 0.15; // 15% VAT
      const COMMISSION_RATE = 0.10; // 10% Platfrom Commission
      const CHAPA_FEE_RATE = 0.035; // 3.5% Chapa Fee

      // Calculate subtotal
      let subtotal = 0;
      for (const item of items) {
        subtotal += item.price * item.quantity;
      }

      // Calculate extra fees
      const taxAmount = subtotal * TAX_RATE;
      const gatewayFee = (subtotal + taxAmount) * CHAPA_FEE_RATE;
      const commissionTotal = subtotal * COMMISSION_RATE;
      const finalTotal = subtotal + taxAmount + gatewayFee;

      // Create order
      const initialStatus = "pending";
      const paymentStatus = "pending";

      const [orderResult] = await connection.query(
        `INSERT INTO Orders (
          user_id, shop_id, delivery_address, total, \`status\`, 
          payment_method, payment_status, tax_amount, 
          commission_total, gateway_fee
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id, shop_id, delivery_address, finalTotal, initialStatus,
          payment_method || 'mobile_banking', paymentStatus, taxAmount,
          commissionTotal, gatewayFee
        ]
      );

      const orderId = orderResult.insertId;

      // Create order items and update stock
      for (const item of items) {
        // Add order item
        await connection.query(
          `INSERT INTO OrderItems (order_id, product_id, size_id, quantity, price) 
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.size_id, item.quantity, item.price]
        );

        // Update stock and check if out of stock
        if (item.size_id) {
          await connection.query(
            "UPDATE ProductSizes SET stock = stock - ? WHERE size_id = ?",
            [item.quantity, item.size_id]
          );
        } else {
          await connection.query(
            "UPDATE Products SET stock = stock - ? WHERE product_id = ?",
            [item.quantity, item.product_id]
          );
        }

        // Auto-deactivate if total stock is 0
        const [sizeStock] = await connection.query(
          "SELECT SUM(stock) as total_stock FROM ProductSizes WHERE product_id = ?",
          [item.product_id]
        );
        const [mainStock] = await connection.query(
          "SELECT stock FROM Products WHERE product_id = ?",
          [item.product_id]
        );

        const totalStock = (sizeStock[0]?.total_stock || 0) + (mainStock[0]?.stock || 0);
        if (totalStock <= 0) {
          await connection.query(
            "UPDATE Products SET is_active = FALSE WHERE product_id = ?",
            [item.product_id]
          );
        }
      }

      await connection.commit();
      connection.release();

      return orderId;
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }

  // Update order status
  static async updateOrderStatus(orderId, status) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get order details for approval logic
      const [orders] = await connection.query(
        "SELECT * FROM Orders WHERE order_id = ?",
        [orderId]
      );

      if (orders.length === 0) {
        throw new Error("Order not found");
      }

      // Handle Status Specific Logic
      const order = orders[0];

      // 1. Admin Approval (Just Status Update)
      if (status === "ADMIN_APPROVED" || status === "approved") {
        if (order.payment_status !== "paid") {
          throw new Error("Cannot approve an unpaid order");
        }
      }

      // Allow other meaningful statuses (delivery_assigned, picked_up, shipped, etc.) 
      // to pass through to the final update query.

      // 2. Delivery Confirmation (Wallet Credit Here)
      if (status === "delivered") {
        // Ensure we don't credit twice
        if (order.status === "delivered") {
          // Already delivered, do nothing or throw
        } else {
          // 1. Calculate Seller Net Earning
          // Net = Total - Tax - GatewayFee - Commission
          const subtotal = Number(order.total) - Number(order.tax_amount) - Number(order.gateway_fee);
          const sellerNet = subtotal - Number(order.commission_total);

          // 2. Update Seller Wallet
          await connection.query(
            `UPDATE SellerWallets 
            SET balance = balance + ?, total_earned = total_earned + ? 
            WHERE shop_id = ?`,
            [sellerNet, sellerNet, order.shop_id]
          );

          // 3. Record Platform Revenue
          await connection.query(
            "INSERT INTO PlatformRevenue (order_id, amount, source) VALUES (?, ?, 'commission')",
            [orderId, order.commission_total]
          );
          await connection.query(
            "INSERT INTO PlatformRevenue (order_id, amount, source) VALUES (?, ?, 'gateway_fee')",
            [orderId, order.gateway_fee]
          );

          // 4. Record Tax
          await connection.query(
            "INSERT INTO TaxRecords (order_id, tax_amount) VALUES (?, ?)",
            [orderId, order.tax_amount]
          );
        }
      }

      // Update the order status
      const finalStatus = status === "approved" ? "ADMIN_APPROVED" : status;
      const [result] = await connection.query(
        "UPDATE Orders SET `status` = ? WHERE order_id = ?",
        [finalStatus, orderId]
      );

      console.log(finalStatus);


      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Cancel order
  static async cancelOrder(orderId, userId = null, userRole = "user") {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [orders] = await connection.query(
        "SELECT status, user_id FROM Orders WHERE order_id = ?",
        [orderId]
      );

      if (orders.length === 0) {
        throw new Error("Order not found");
      }

      const order = orders[0];

      // Role-Based Cancellation Rules
      if (userRole === "user") {
        // Customer: Can only cancel PENDING
        if (order.status !== "pending") {
          throw new Error("You can only cancel pending orders.");
        }
        // Verify ownership
        if (userId && order.user_id !== userId) {
          throw new Error("You can only cancel your own orders");
        }
      } else if (userRole === "admin" || userRole === "super_admin") {
        // Admin: Can cancel Pending, Paid, Approved, Delivery Assigned
        // Cannot cancel: Picked Up, Shipped, Delivered
        const cancellable = ["pending", "paid", "ADMIN_APPROVED", "approved", "delivery_assigned"];
        if (!cancellable.includes(order.status)) {
          throw new Error(`Cannot cancel order in status: ${order.status}`);
        }
      } else {
        // Shop Owner / Delivery Person: Not allowed to cancel
        throw new Error("You do not have permission to cancel orders.");
      }

      // Update order status
      await connection.query(
        'UPDATE Orders SET `status` = "cancelled" WHERE order_id = ?',
        [orderId]
      );

      // Restore stock
      const [items] = await connection.query(
        "SELECT size_id, quantity FROM OrderItems WHERE order_id = ?",
        [orderId]
      );

      for (const item of items) {
        if (item.size_id) {
          await connection.query(
            "UPDATE ProductSizes SET stock = stock + ? WHERE size_id = ?",
            [item.quantity, item.size_id]
          );
        }
      }

      // Cleanup pending bank transfers if any
      await BankTransferService.cancelPendingTransfer(orderId, connection);

      await connection.commit();
      connection.release();

      return true;
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }

  // Get user orders
  static async getUserOrders(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [orders] = await pool.query(
      `SELECT o.*, o.order_id as id, s.shop_name
       FROM Orders o
       JOIN Shops s ON o.shop_id = s.shop_id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    for (const order of orders) {
      await this._enrichOrderData(order);
    }

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM Orders WHERE user_id = ?",
      [userId]
    );

    const total = countResult[0].total;

    return {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get shop orders
  static async getShopOrders(shopId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [orders] = await pool.query(
      `SELECT o.*, o.order_id as id, u.full_name as customer_name
       FROM Orders o
       JOIN Users u ON o.user_id = u.user_id
       WHERE o.shop_id = ? 
       AND o.\`status\` IN ('ADMIN_APPROVED', 'approved', 'delivery_assigned', 'picked_up', 'shipped', 'delivered')
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [shopId, parseInt(limit), parseInt(offset)]
    );

    for (const order of orders) {
      await this._enrichOrderData(order);
    }

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM Orders WHERE shop_id = ?",
      [shopId]
    );

    const total = countResult[0].total;

    return {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Request return
  static async requestReturn(orderItemId, returnReason) {
    // Check if order item exists and was delivered
    const [orderItems] = await pool.query(
      `SELECT oi.*, o.\`status\` as order_status
       FROM OrderItems oi
       JOIN Orders o ON oi.order_id = o.order_id
       WHERE oi.order_item_id = ?`,
      [orderItemId]
    );

    if (orderItems.length === 0) {
      throw new Error("Order item not found");
    }

    if (orderItems[0].order_status !== "delivered") {
      throw new Error("Can only request return for delivered items");
    }

    // Check if return already requested
    const [existing] = await pool.query(
      "SELECT return_id FROM ReturnedItems WHERE order_item_id = ?",
      [orderItemId]
    );

    if (existing.length > 0) {
      throw new Error("Return already requested for this item");
    }

    const [result] = await pool.query(
      'INSERT INTO ReturnedItems (order_item_id, return_reason, status) VALUES (?, ?, "pending")',
      [orderItemId, returnReason]
    );

    return result.insertId;
  }

  // Private helper to enrich order data with items and bank details
  static async _enrichOrderData(order) {
    // 1. Get items
    const [items] = await pool.query(
      `SELECT oi.*, p.product_name, ps.size_label,
              (SELECT image_url FROM ProductImages WHERE product_id = p.product_id LIMIT 1) as main_image
       FROM OrderItems oi
       JOIN Products p ON oi.product_id = p.product_id
       LEFT JOIN ProductSizes ps ON oi.size_id = ps.size_id
       WHERE oi.order_id = ?`,
      [order.order_id]
    );
    order.items = items;

    // 2. Get bank transfer details
    if (order.payment_method === "bank_transfer") {
      const banks = ["awash", "cbe", "birhan"];
      for (const bank of banks) {
        const table = `${bank}_bank_payments`;
        const [bankPayment] = await pool.query(
          `SELECT status as bank_payment_status, rejection_reason, transaction_id, '${bank}' as bank_type 
           FROM ${table} WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`,
          [order.order_id]
        );
        if (bankPayment.length > 0) {
          order.bank_transfer_details = bankPayment[0];
          break;
        }
      }
    }
  }
}
