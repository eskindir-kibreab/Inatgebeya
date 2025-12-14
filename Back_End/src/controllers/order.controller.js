import pool from "../config/db.js";
import { ShopService } from "../services/shop.service.js";
import { validationResult } from "express-validator";
import { OrderService } from "../services/order.service.js";

// Get all orders (Admin, Super Admin)
export const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      user_id,
      shop_id,
      status,
      start_date,
      end_date,
    } = req.query;

    const filters = { user_id, shop_id, status, start_date, end_date };

    // Shop owner can only see their shop's orders
    if (req.user.role_name === "shop_owner") {
      const shop = await ShopService.getShopByOwnerId(req.user.user_id);
      if (shop) {
        filters.shop_id = shop.shop_id;
      }
    }

    const result = await OrderService.getAllOrders(filters, page, limit);

    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrderService.getOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check permissions
    if (req.user.role_name === "user" && order.user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own orders",
      });
    }

    if (
      req.user.role_name === "shop_owner" &&
      order.shop_id !== req.user.shop_id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view orders from your shop",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

// Create order
export const createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { shop_id, delivery_address, items } = req.body;

  try {
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.price) {
        return res.status(400).json({
          success: false,
          message: "Each item must have product_id, quantity, and price",
        });
      }

      // Check stock if size specified
      if (item.size_id) {
        const [stock] = await pool.query(
          "SELECT stock FROM ProductSizes WHERE size_id = ?",
          [item.size_id]
        );

        if (stock.length === 0 || stock[0].stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for size ID ${item.size_id}`,
          });
        }
      }
    }

    const orderId = await OrderService.createOrder({
      user_id: req.user.user_id,
      shop_id,
      delivery_address,
      items,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: { orderId },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "approved",
      "delivering",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Check permissions for shop owner
    if (req.user.role_name === "shop_owner") {
      const order = await OrderService.getOrderById(id);
      if (!order || order.shop_id !== req.user.shop_id) {
        return res.status(403).json({
          success: false,
          message: "You can only update orders from your shop",
        });
      }
    }

    const affectedRows = await OrderService.updateOrderStatus(id, status);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user owns the order
    if (req.user.role_name === "user") {
      const order = await OrderService.getOrderById(id);
      if (!order || order.user_id !== req.user.user_id) {
        return res.status(403).json({
          success: false,
          message: "You can only cancel your own orders",
        });
      }
    }

    await OrderService.cancelOrder(
      id,
      req.user.role_name === "user" ? req.user.user_id : null
    );

    res.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    if (error.message === "Order not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.startsWith("Cannot cancel order")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
};

// Get my orders (for user)
export const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await OrderService.getUserOrders(
      req.user.user_id,
      page,
      limit
    );

    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your orders",
    });
  }
};

// Request return
export const requestReturn = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { order_item_id, return_reason } = req.body;

  try {
    // Verify order item belongs to user
    const [orderItems] = await pool.query(
      `SELECT oi.*, o.user_id
       FROM OrderItems oi
       JOIN Orders o ON oi.order_id = o.order_id
       WHERE oi.order_item_id = ?`,
      [order_item_id]
    );

    if (orderItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order item not found",
      });
    }

    if (orderItems[0].user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "You can only request return for your own orders",
      });
    }

    const returnId = await OrderService.requestReturn(
      order_item_id,
      return_reason
    );

    res.status(201).json({
      success: true,
      message: "Return request submitted successfully",
      data: { returnId },
    });
  } catch (error) {
    console.error("Request return error:", error);

    if (
      error.message === "Can only request return for delivered items" ||
      error.message === "Return already requested for this item"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to request return",
    });
  }
};
