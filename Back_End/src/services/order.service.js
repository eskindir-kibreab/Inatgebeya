import pool from "../config/db.js";

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
      query += " AND o.status = ?";
      params.push(status);
    }

    if (start_date) {
      query += " AND DATE(o.created_at) >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND DATE(o.created_at) <= ?";
      params.push(end_date);
    }

    // Get total count
    const countQuery = query.replace(
      /SELECT o\.\*, u\.full_name as customer_name, s\.shop_name/,
      "SELECT COUNT(*) as total"
    );
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    query += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [orders] = await pool.query(query, params);

    // Get order items for each order
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, p.product_name, ps.size_label
         FROM OrderItems oi
         JOIN Products p ON oi.product_id = p.product_id
         LEFT JOIN ProductSizes ps ON oi.size_id = ps.size_id
         WHERE oi.order_id = ?`,
        [order.order_id]
      );
      order.items = items;
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
      `SELECT o.*, u.full_name as customer_name, u.email as customer_email, 
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

    // Get order items
    const [items] = await pool.query(
      `SELECT oi.*, p.product_name, p.main_image, ps.size_label
       FROM OrderItems oi
       JOIN Products p ON oi.product_id = p.product_id
       LEFT JOIN ProductSizes ps ON oi.size_id = ps.size_id
       WHERE oi.order_id = ?`,
      [orderId]
    );
    order.items = items;

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
    const { user_id, shop_id, delivery_address, items, payment_method } = orderData;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Calculate total
      let total = 0;
      for (const item of items) {
        total += item.price * item.quantity;
      }

      // Create order
      const initialStatus = payment_method === "mobile_banking" ? "approved" : "pending";
      const paymentStatus = payment_method === "mobile_banking" ? "paid" : "pending";

      const [orderResult] = await connection.query(
        `INSERT INTO Orders (user_id, shop_id, delivery_address, total, status, payment_method, payment_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, shop_id, delivery_address, total, initialStatus, payment_method || 'cash_on_delivery', paymentStatus]
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
    const [result] = await pool.query(
      "UPDATE Orders SET status = ? WHERE order_id = ?",
      [status, orderId]
    );

    return result.affectedRows;
  }

  // Cancel order
  static async cancelOrder(orderId, userId = null) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if order can be cancelled (only pending orders)
      const [orders] = await connection.query(
        "SELECT status, user_id FROM Orders WHERE order_id = ?",
        [orderId]
      );

      if (orders.length === 0) {
        throw new Error("Order not found");
      }

      const order = orders[0];

      if (order.status !== "pending") {
        throw new Error(`Cannot cancel order with status: ${order.status}`);
      }

      if (userId && order.user_id !== userId) {
        throw new Error("You can only cancel your own orders");
      }

      // Update order status
      await connection.query(
        'UPDATE Orders SET status = "cancelled" WHERE order_id = ?',
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
      `SELECT o.*, s.shop_name
       FROM Orders o
       JOIN Shops s ON o.shop_id = s.shop_id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

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
      `SELECT o.*, u.full_name as customer_name
       FROM Orders o
       JOIN Users u ON o.user_id = u.user_id
       WHERE o.shop_id = ?
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [shopId, parseInt(limit), parseInt(offset)]
    );

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
      `SELECT oi.*, o.status as order_status
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

  // Update return status
  static async updateReturnStatus(returnId, status) {
    const [result] = await pool.query(
      "UPDATE ReturnedItems SET status = ? WHERE return_id = ?",
      [status, returnId]
    );

    return result.affectedRows;
  }
}
