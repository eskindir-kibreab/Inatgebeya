// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { hasPermission } from "../config/role.js"; // keep as you had

// Named export as authMiddleware to match your imports
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "") || null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No authentication token, access denied",
      });
    }

    // Check token exists in DB (and optionally check expires_at)
    const [rows] = await pool.query(
      "SELECT * FROM usertokens WHERE token = ?",
      [token]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }

    // Optionally check expires_at column if you populate it
    if (rows[0].expires_at && new Date(rows[0].expires_at) < new Date()) {
      // expired in DB
      await pool
        .query("DELETE FROM usertokens WHERE token = ?", [token])
        .catch(() => { });
      return res.status(401).json({ success: false, message: "Token expired" });
    }

    // Verify JWT signature
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // invalid signature or expired
      return res.status(401).json({
        success: false,
        message:
          err.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
      });
    }

    // Ensure user is active and get shop_id if they are a shop owner
    const [users] = await pool.query(
      `SELECT u.*, r.role_name, s.shop_id 
       FROM Users u 
       JOIN Roles r ON u.role_id = r.role_id 
       LEFT JOIN Shops s ON u.user_id = s.owner_id
       WHERE u.user_id = ? AND u.is_active = TRUE`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "User not found or inactive" });
    }

    // attach user and token info
    req.user = users[0];
    req.token = token;
    req.userTokenRow = rows[0];

    next();
  } catch (error) {
    console.error("Auth middleware error:", error?.message || error);
    return res
      .status(401)
      .json({ success: false, message: "Authentication failed" });
  }
};

// Optional auth middleware - populates req.user if token is valid, but doesn't block if not
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "") || null;

    if (!token) {
      return next();
    }

    const [rows] = await pool.query(
      "SELECT * FROM usertokens WHERE token = ?",
      [token]
    );

    if (rows.length === 0) {
      return next();
    }

    if (rows[0].expires_at && new Date(rows[0].expires_at) < new Date()) {
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next();
    }

    const [users] = await pool.query(
      `SELECT u.*, r.role_name, s.shop_id 
       FROM Users u 
       JOIN Roles r ON u.role_id = r.role_id 
       LEFT JOIN Shops s ON u.user_id = s.owner_id
       WHERE u.user_id = ? AND u.is_active = TRUE`,
      [decoded.userId]
    );

    if (users.length > 0) {
      req.user = users[0];
      req.token = token;
      req.userTokenRow = rows[0];
    }

    next();
  } catch (error) {
    console.error("Optional auth error:", error);
    next();
  }
};

// Role-based middleware (keeps your original signatures)
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role_name)) {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }
    next();
  };
};

export const requirePermission = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    if (!hasPermission(req.user.role_name, requiredRole)) {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }
    next();
  };
};
