import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import { UserService } from "../services/user.service.js";

// Get all users (Super Admin, Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, is_active } = req.query;

    const result = await UserService.getAllUsers(
      { role, search, is_active },
      page,
      limit
    );

    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// Create user (Super Admin, Admin only - any role)
export const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { full_name, email, password, phone, role_name } = req.body;

  try {
    // Check if user already exists
    const emailExists = await UserService.emailExists(email);
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Get role ID
    const [roles] = await pool.query(
      "SELECT role_id FROM Roles WHERE role_name = ?",
      [role_name]
    );

    if (roles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = await UserService.createUser({
      full_name,
      email,
      password_hash: hashedPassword,
      phone,
      role_id: roles[0].role_id,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { userId },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
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
    // Remove fields that shouldn't be updated directly
    delete updates.password_hash;
    delete updates.role_name;

    // If password is being updated, hash it
    if (updates.password) {
      updates.password_hash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    const affectedRows = await UserService.updateUser(id, updates);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found or no changes made",
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// Delete user (hard delete)
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Cannot delete self
    if (parseInt(id) === req.user.user_id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    const affectedRows = await UserService.forceDeleteUser(id);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User and all associated data deleted successfully (Force Deleted)",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete user. Technical error: " + error.message,
    });
  }
};

// Change user role
export const changeUserRole = async (req, res) => {
  const { id } = req.params;
  const { role_name } = req.body;

  try {
    // Get role ID
    const [roles] = await pool.query(
      "SELECT role_id FROM Roles WHERE role_name = ?",
      [role_name]
    );

    if (roles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    const affectedRows = await UserService.changeUserRole(id, roles[0].role_id);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("Change role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change user role",
    });
  }
};

// Update own profile
export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const updates = req.body;
  const userId = req.user.user_id;

  try {
    // Remove restricted fields
    delete updates.role_name;
    delete updates.is_active;
    delete updates.role_id;
    delete updates.password;
    delete updates.password_hash;

    // Check if email already exists
    if (updates.email && updates.email !== req.user.email) {
      const emailExists = await UserService.emailExists(updates.email, userId);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    const affectedRows = await UserService.updateUser(userId, updates);

    if (affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "No changes made",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// Change own password
export const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { currentPassword, newPassword } = req.body;
  const userId = req.user.user_id;

  try {
    // Get user with password hash
    const [users] = await pool.query(
      "SELECT password_hash FROM Users WHERE user_id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect current password",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await UserService.updateUser(userId, { password_hash: hashedPassword });

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update password",
    });
  }
};

// Get current user profile
export const getCurrentUser = async (req, res) => {
  try {
    // Get user coins
    const [coins] = await pool.query(
      "SELECT balance FROM UserCoins WHERE user_id = ?",
      [req.user.user_id]
    );

    // Remove password hash from response
    const { password_hash, ...userData } = req.user;

    res.json({
      success: true,
      data: {
        ...userData,
        coins: coins.length > 0 ? coins[0].balance : 0,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
    });
  }
};
