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

  const { user_id, area_id, name, email, phone, password } = req.body;

  try {
    let targetUserId = user_id;

    // Get delivery person role
    const [roles] = await pool.query(
      "SELECT role_id FROM Roles WHERE role_name = ?",
      ["delivery_person"]
    );

    if (roles.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Delivery person role not found",
      });
    }

    const deliveryPersonRoleId = roles[0].role_id;

    // If no user_id, create a new user
    if (!targetUserId) {
      // Check if email already exists
      const emailExists = await UserService.emailExists(email);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      // Import bcrypt for hashing
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.default.hash(password, 10);

      targetUserId = await UserService.createUser({
        full_name: name,
        email,
        phone,
        password_hash: hashedPassword,
        role_id: deliveryPersonRoleId,
      });
    } else {
      // Check if user exists
      const user = await UserService.getUserById(targetUserId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if user already is a delivery person
      const existing = await DeliveryService.getDeliveryPersonByUserId(
        targetUserId
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "User is already a delivery person",
        });
      }

      // Update user role to delivery_person
      await UserService.changeUserRole(targetUserId, deliveryPersonRoleId);
    }

    const deliveryPersonId = await DeliveryService.createDeliveryPerson({
      user_id: targetUserId,
      area_id,
    });

    res.status(201).json({
      success: true,
      message: "Delivery person created successfully",
      data: { deliveryPersonId, user_id: targetUserId },
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
  const { name, email, phone, area_id } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get delivery person to find their user_id
    const [dp] = await connection.query(
      "SELECT user_id FROM DeliveryPersons WHERE delivery_person_id = ?",
      [id]
    );

    if (dp.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Delivery person not found",
      });
    }

    const userId = dp[0].user_id;

    // Update User details if provided
    const userUpdates = [];
    const userParams = [];
    if (name) {
      userUpdates.push("full_name = ?");
      userParams.push(name);
    }
    if (email) {
      userUpdates.push("email = ?");
      userParams.push(email);
    }
    if (phone) {
      userUpdates.push("phone = ?");
      userParams.push(phone);
    }

    if (userUpdates.length > 0) {
      userParams.push(userId);
      await connection.query(
        `UPDATE Users SET ${userUpdates.join(", ")} WHERE user_id = ?`,
        userParams
      );
    }

    // Update DeliveryPerson details (area_id) if provided
    if (area_id) {
      await connection.query(
        "UPDATE DeliveryPersons SET area_id = ? WHERE delivery_person_id = ?",
        [area_id, id]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Delivery person updated successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update delivery person error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update delivery person",
    });
  } finally {
    connection.release();
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
      message: `Delivery person ${status === "active" ? "activated" : "deactivated"
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
    let { page = 1, limit = 20, area_id } = req.query;

    // If delivery person, restrict to their area
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
      area_id = deliveryPerson.area_id;
    }

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
    // If delivery person is self-assigning
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

      // Ensure they are assigning to themselves
      if (parseInt(delivery_person_id) !== deliveryPerson.delivery_person_id) {
        return res.status(403).json({
          success: false,
          message: "You can only assign deliveries to yourself",
        });
      }

      // Optional: Check if order is in their area (logic should be in service or here)
      // For now, relying on the fact they can only SEE orders in their area via getPendingDeliveries
    }

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

    const validStatuses = ["assigned", "picked", "shipped", "delivered", "returned"];
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

// Get current delivery person profile
export const getDeliveryProfile = async (req, res) => {
  try {
    const deliveryPerson = await DeliveryService.getDeliveryPersonByUserId(
      req.user.user_id
    );

    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Delivery person profile not found",
      });
    }

    res.json({
      success: true,
      data: deliveryPerson,
    });
  } catch (error) {
    console.error("Get delivery profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery profile",
    });
  }
};

// Delete delivery person and associated user
export const deleteDeliveryPerson = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Get user_id associated with this delivery person
    const [dp] = await pool.query(
      "SELECT user_id FROM DeliveryPersons WHERE delivery_person_id = ?",
      [id]
    );

    if (dp.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found",
      });
    }

    const userId = dp[0].user_id;

    // 2. Perform Force Delete of the User (which also deletes the DeliveryPerson record)
    await UserService.forceDeleteUser(userId);

    res.json({
      success: true,
      message: "Delivery person and user deleted successfully (Force Deleted)",
    });
  } catch (error) {
    console.error("Delete delivery person error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete delivery person. Technical error: " + error.message,
    });
  }
};
