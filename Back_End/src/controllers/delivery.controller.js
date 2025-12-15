import { validationResult } from "express-validator";
import { DeliveryService } from "../services/delivery.service.js";
import { UserService } from "../services/user.service.js";
import pool from "../config/db.js";

// Get all delivery persons
export const getAllDeliveryPersons = async (req, res) => {
  try {
    const { page = 1, limit = 20, area_id, status, search } = req.query;

    const result = await DeliveryService.getAllDeliveryPersons(
      { area_id, status, search },
      page,
      limit
    );

    res.json({
      success: true,
      data: result.deliveryPersons,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get delivery persons error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery persons",
    });
  }
};

// Get delivery person by ID
export const getDeliveryPersonById = async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryPerson = await DeliveryService.getDeliveryPersonById(id);

    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found",
      });
    }

    res.json({
      success: true,
      data: deliveryPerson,
    });
  } catch (error) {
    console.error("Get delivery person error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery person",
    });
  }
};

// Create delivery person
export const createDeliveryPerson = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { user_id, area_id } = req.body;

  try {
    // Check if user exists and has delivery person role
    const user = await UserService.getUserById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user already is a delivery person
    const existing = await DeliveryService.getDeliveryPersonByUserId(user_id);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User is already a delivery person",
      });
    }

    const deliveryPersonId = await DeliveryService.createDeliveryPerson({
      user_id,
      area_id,
    });

    // Update user role to delivery_person
    const [roles] = await pool.query(
      "SELECT role_id FROM Roles WHERE role_name = ?",
      ["delivery_person"]
    );

    if (roles.length > 0) {
      await pool.query("UPDATE Users SET role_id = ? WHERE user_id = ?", [
        roles[0].role_id,
        user_id,
      ]);
    }

    res.status(201).json({
      success: true,
      message: "Delivery person created successfully",
      data: { deliveryPersonId },
    });
  } catch (error) {
    console.error("Create delivery person error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create delivery person",
    });
  }
};

// Update delivery person
export const updateDeliveryPerson = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const updates = req.body;

  try {
    const affectedRows = await DeliveryService.updateDeliveryPerson(
      id,
      updates
    );

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found or no changes made",
      });
    }

    res.json({
      success: true,
      message: "Delivery person updated successfully",
    });
  } catch (error) {
    console.error("Update delivery person error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update delivery person",
    });
  }
};

// Toggle delivery person status
export const toggleDeliveryPersonStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "active" or "inactive"',
      });
    }

    const affectedRows = await DeliveryService.toggleDeliveryPersonStatus(
      id,
      status
    );

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found",
      });
    }

    res.json({
      success: true,
      message: `Delivery person ${
        status === "active" ? "activated" : "deactivated"
      } successfully`,
    });
  } catch (error) {
    console.error("Toggle delivery person status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update delivery person status",
    });
  }
};

// Get pending deliveries
export const getPendingDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 20, area_id } = req.query;

    const result = await DeliveryService.getPendingDeliveries(
      area_id,
      page,
      limit
    );

    res.json({
      success: true,
      data: result.deliveries,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get pending deliveries error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending deliveries",
    });
  }
};

// Get assigned deliveries (for delivery person)
export const getAssignedDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Get delivery person ID from user
    const deliveryPerson = await DeliveryService.getDeliveryPersonByUserId(
      req.user.user_id
    );
    if (!deliveryPerson) {
      return res.status(403).json({
        success: false,
        message: "You are not registered as a delivery person",
      });
    }

    const result = await DeliveryService.getAssignedDeliveries(
      deliveryPerson.delivery_person_id,
      page,
      limit
    );

    res.json({
      success: true,
      data: result.deliveries,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get assigned deliveries error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned deliveries",
    });
  }
};

// Assign delivery
export const assignDelivery = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { order_id, delivery_person_id } = req.body;

  try {
    const deliveryId = await DeliveryService.assignDelivery(
      order_id,
      delivery_person_id
    );

    res.status(201).json({
      success: true,
      message: "Delivery assigned successfully",
      data: { deliveryId },
    });
  } catch (error) {
    console.error("Assign delivery error:", error);

    if (
      error.message === "Order not found" ||
      error.message === "Order is not ready for delivery" ||
      error.message === "Order already assigned to a delivery person"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to assign delivery",
    });
  }
};

// Update delivery status
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["assigned", "picked", "delivered", "returned"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    let deliveryPersonId = null;

    // If delivery person is updating, verify they own the delivery
    if (req.user.role_name === "delivery_person") {
      const deliveryPerson = await DeliveryService.getDeliveryPersonByUserId(
        req.user.user_id
      );
      if (!deliveryPerson) {
        return res.status(403).json({
          success: false,
          message: "You are not registered as a delivery person",
        });
      }
      deliveryPersonId = deliveryPerson.delivery_person_id;
    }

    const affectedRows = await DeliveryService.updateDeliveryStatus(
      id,
      status,
      deliveryPersonId
    );

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found or you are not authorized",
      });
    }

    res.json({
      success: true,
      message: "Delivery status updated successfully",
    });
  } catch (error) {
    console.error("Update delivery status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update delivery status",
    });
  }
};

// Get delivery history
export const getDeliveryHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, delivery_person_id } = req.query;

    let targetDeliveryPersonId = delivery_person_id;

    // If delivery person is viewing their own history
    if (req.user.role_name === "delivery_person" && !delivery_person_id) {
      const deliveryPerson = await DeliveryService.getDeliveryPersonByUserId(
        req.user.user_id
      );
      if (!deliveryPerson) {
        return res.status(403).json({
          success: false,
          message: "You are not registered as a delivery person",
        });
      }
      targetDeliveryPersonId = deliveryPerson.delivery_person_id;
    }

    if (!targetDeliveryPersonId) {
      return res.status(400).json({
        success: false,
        message: "Delivery person ID is required",
      });
    }

    const result = await DeliveryService.getDeliveryHistory(
      targetDeliveryPersonId,
      page,
      limit
    );

    res.json({
      success: true,
      data: result.deliveries,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get delivery history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery history",
    });
  }
};

// Get delivery statistics
export const getDeliveryStats = async (req, res) => {
  try {
    const { delivery_person_id, area_id, start_date, end_date } = req.query;

    const stats = await DeliveryService.getDeliveryStats(
      delivery_person_id,
      area_id,
      start_date,
      end_date
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get delivery stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery statistics",
    });
  }
};
