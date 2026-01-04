import { OrderService } from "./order.service.js";
import pool from "../config/db.js";

export class DeliveryService {
  // Get all delivery persons
  static async getAllDeliveryPersons(filters = {}, page = 1, limit = 20) {
    const { area_id, status, search } = filters;
    const offset = (page - 1) * limit;

    // Build main query
    let query = `
      SELECT dp.*, u.full_name, u.email, u.phone, a.area_name,
             COUNT(do.delivery_id) as total_deliveries,
             SUM(CASE WHEN do.status = 'delivered' THEN 1 ELSE 0 END) as completed_deliveries
      FROM DeliveryPersons dp
      JOIN Users u ON dp.user_id = u.user_id
      JOIN Areas a ON dp.area_id = a.area_id
      LEFT JOIN DeliveryOrders do ON dp.delivery_person_id = do.delivery_person_id
      WHERE 1=1
    `;
    const params = [];

    if (area_id) {
      query += " AND dp.area_id = ?";
      params.push(area_id);
    }

    if (status) {
      query += " AND dp.status = ?";
      params.push(status);
    }

    if (search) {
      query += " AND (u.full_name LIKE ? OR u.email LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Group by delivery person
    query += " GROUP BY dp.delivery_person_id";

    // Get total count - create separate count query
    let countQuery = `
      SELECT COUNT(DISTINCT dp.delivery_person_id) as total
      FROM DeliveryPersons dp
      JOIN Users u ON dp.user_id = u.user_id
      JOIN Areas a ON dp.area_id = a.area_id
      WHERE 1=1
    `;
    const countParams = [];

    if (area_id) {
      countQuery += " AND dp.area_id = ?";
      countParams.push(area_id);
    }

    if (status) {
      countQuery += " AND dp.status = ?";
      countParams.push(status);
    }

    if (search) {
      countQuery += " AND (u.full_name LIKE ? OR u.email LIKE ?)";
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    // Add pagination to main query
    query += " ORDER BY u.full_name LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [deliveryPersons] = await pool.query(query, params);

    return {
      deliveryPersons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get delivery person by ID
  static async getDeliveryPersonById(deliveryPersonId) {
    const [deliveryPersons] = await pool.query(
      `SELECT dp.*, u.full_name, u.email, u.phone, a.area_name
       FROM DeliveryPersons dp
       JOIN Users u ON dp.user_id = u.user_id
       JOIN Areas a ON dp.area_id = a.area_id
       WHERE dp.delivery_person_id = ?`,
      [deliveryPersonId]
    );

    return deliveryPersons.length > 0 ? deliveryPersons[0] : null;
  }

  // Get delivery person by user ID
  static async getDeliveryPersonByUserId(userId) {
    const [deliveryPersons] = await pool.query(
      `SELECT dp.*, u.full_name, u.email, u.phone, a.area_name
       FROM DeliveryPersons dp
       JOIN Users u ON dp.user_id = u.user_id
       JOIN Areas a ON dp.area_id = a.area_id
       WHERE dp.user_id = ?`,
      [userId]
    );

    return deliveryPersons.length > 0 ? deliveryPersons[0] : null;
  }

  // Create delivery person
  static async createDeliveryPerson(deliveryPersonData) {
    const { user_id, area_id } = deliveryPersonData;

    const [result] = await pool.query(
      'INSERT INTO DeliveryPersons (user_id, area_id, status) VALUES (?, ?, "active")',
      [user_id, area_id]
    );

    return result.insertId;
  }

  // Update delivery person
  static async updateDeliveryPerson(deliveryPersonId, updates) {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      return 0;
    }

    values.push(deliveryPersonId);

    const [result] = await pool.query(
      `UPDATE DeliveryPersons SET ${fields.join(
        ", "
      )} WHERE delivery_person_id = ?`,
      values
    );

    return result.affectedRows;
  }

  // Toggle delivery person status
  static async toggleDeliveryPersonStatus(deliveryPersonId, status) {
    const [result] = await pool.query(
      "UPDATE DeliveryPersons SET status = ? WHERE delivery_person_id = ?",
      [status, deliveryPersonId]
    );

    return result.affectedRows;
  }

  // Get pending deliveries
  static async getPendingDeliveries(areaId = null, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, u.full_name as customer_name, u.phone as customer_phone,
             s.shop_name, a.area_name as shop_area,
             do.delivery_id, do.status as delivery_status
      FROM Orders o
      JOIN Users u ON o.user_id = u.user_id
      JOIN Shops s ON o.shop_id = s.shop_id
      JOIN Areas a ON s.area_id = a.area_id
      LEFT JOIN DeliveryOrders do ON o.order_id = do.order_id
      WHERE o.status IN ('approved', 'delivering')
      AND (do.delivery_id IS NULL OR do.status IN ('assigned', 'picked'))
    `;
    const params = [];

    if (areaId) {
      query += " AND s.area_id = ?";
      params.push(areaId);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Orders o
      JOIN Shops s ON o.shop_id = s.shop_id
      LEFT JOIN DeliveryOrders do ON o.order_id = do.order_id
      WHERE o.status IN ('approved', 'delivering')
      AND (do.delivery_id IS NULL OR do.status IN ('assigned', 'picked'))
      ${areaId ? " AND s.area_id = ?" : ""}
    `;

    const countParams = areaId ? [areaId] : [];
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    // Add pagination
    query += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [deliveries] = await pool.query(query, params);

    return {
      deliveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get assigned deliveries for delivery person
  static async getAssignedDeliveries(deliveryPersonId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [deliveries] = await pool.query(
      `SELECT do.*, o.order_id, o.total, o.delivery_address, o.status as order_status,
              u.full_name as customer_name, u.phone as customer_phone,
              s.shop_name, s.shop_id,
              a.area_name as shop_area
       FROM DeliveryOrders do
       JOIN Orders o ON do.order_id = o.order_id
       JOIN Users u ON o.user_id = u.user_id
       JOIN Shops s ON o.shop_id = s.shop_id
       JOIN Areas a ON s.area_id = a.area_id
       WHERE do.delivery_person_id = ?
       AND do.status IN ('assigned', 'picked')
       ORDER BY do.delivery_id DESC
       LIMIT ? OFFSET ?`,
      [deliveryPersonId, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total
       FROM DeliveryOrders
       WHERE delivery_person_id = ?
       AND status IN ('assigned', 'picked')`,
      [deliveryPersonId]
    );

    const total = countResult[0].total;

    return {
      deliveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Assign delivery
  static async assignDelivery(orderId, deliveryPersonId) {
    // Check if order is ready for delivery
    const [orders] = await pool.query(
      "SELECT status FROM Orders WHERE order_id = ?",
      [orderId]
    );

    if (orders.length === 0) {
      throw new Error("Order not found");
    }

    // Allow assignment from Approved or already Delivering states
    if (!["approved", "ADMIN_APPROVED", "delivering", "delivery_assigned"].includes(orders[0].status)) {
      throw new Error("Order is not ready for delivery");
    }

    // Check if already assigned
    const [existing] = await pool.query(
      'SELECT delivery_id FROM DeliveryOrders WHERE order_id = ? AND status IN ("assigned", "picked")',
      [orderId]
    );

    if (existing.length > 0) {
      throw new Error("Order already assigned to a delivery person");
    }

    const [result] = await pool.query(
      'INSERT INTO DeliveryOrders (order_id, delivery_person_id, status) VALUES (?, ?, "assigned")',
      [orderId, deliveryPersonId]
    );

    // Sync Order Status: Set to 'delivery_assigned'
    await OrderService.updateOrderStatus(orderId, "delivery_assigned");

    return result.insertId;
  }

  // Update delivery status
  static async updateDeliveryStatus(
    deliveryId,
    status,
    deliveryPersonId = null
  ) {
    let query = "UPDATE DeliveryOrders SET status = ? WHERE delivery_id = ?";
    const params = [status, deliveryId];

    if (deliveryPersonId) {
      query += " AND delivery_person_id = ?";
      params.push(deliveryPersonId);
    }

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return 0;
    }

    // Get order ID
    const [delivery] = await pool.query(
      "SELECT order_id FROM DeliveryOrders WHERE delivery_id = ?",
      [deliveryId]
    );

    if (delivery.length > 0) {
      const orderId = delivery[0].order_id; // Fix: use delivery[0] not delivery

      // Get current order status to enforce flow
      const [currentOrder] = await pool.query("SELECT status FROM Orders WHERE order_id = ?", [orderId]);
      const currentStatus = currentOrder[0]?.status;

      // Sync Order Status based on Delivery Status
      if (status === "picked") {
        if (currentStatus !== "shipped") {
          throw new Error("Cannot pick up order. Shop owner must mark it as 'Shipped' first.");
        }
        await OrderService.updateOrderStatus(orderId, "picked_up");

      } else if (status === "delivered") {
        // Strict Check: Must be Picked Up first
        if (currentStatus !== "picked_up") {
          throw new Error("Cannot mark delivered. Order must be 'Picked Up' first.");
        }

        // This triggers the wallet credit logic in OrderService
        await OrderService.updateOrderStatus(orderId, "delivered");

        await pool.query(
          "UPDATE DeliveryOrders SET delivered_at = NOW() WHERE delivery_id = ?",
          [deliveryId]
        );
      }
    }

    return result.affectedRows;
  }

  // Get delivery history for delivery person
  static async getDeliveryHistory(deliveryPersonId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [deliveries] = await pool.query(
      `SELECT do.*, o.order_id, o.total, o.delivery_address,
              u.full_name as customer_name,
              s.shop_name,
              a.area_name as shop_area
       FROM DeliveryOrders do
       JOIN Orders o ON do.order_id = o.order_id
       JOIN Users u ON o.user_id = u.user_id
       JOIN Shops s ON o.shop_id = s.shop_id
       JOIN Areas a ON s.area_id = a.area_id
       WHERE do.delivery_person_id = ?
       ORDER BY do.delivered_at DESC, do.delivery_id DESC
       LIMIT ? OFFSET ?`,
      [deliveryPersonId, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM DeliveryOrders WHERE delivery_person_id = ?",
      [deliveryPersonId]
    );

    const total = countResult[0].total;

    return {
      deliveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get delivery statistics
  static async getDeliveryStats(
    deliveryPersonId = null,
    areaId = null,
    startDate = null,
    endDate = null
  ) {
    let query = `
      SELECT 
        COUNT(*) as total_deliveries,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status = 'picked' THEN 1 ELSE 0 END) as picked,
        SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned
      FROM DeliveryOrders
      WHERE 1=1
    `;
    const params = [];

    if (deliveryPersonId) {
      query += " AND delivery_person_id = ?";
      params.push(deliveryPersonId);
    }

    if (areaId) {
      query += ` AND order_id IN (
        SELECT o.order_id 
        FROM Orders o 
        JOIN Shops s ON o.shop_id = s.shop_id 
        WHERE s.area_id = ?
      )`;
      params.push(areaId);
    }

    if (startDate) {
      query += " AND DATE(created_at) >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND DATE(created_at) <= ?";
      params.push(endDate);
    }

    const [stats] = await pool.query(query, params);

    return stats[0];
  }
}
