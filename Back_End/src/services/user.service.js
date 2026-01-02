import pool from "../config/db.js";

export class UserService {
  // Get all users with filters and pagination
  static async getAllUsers(filters = {}, page = 1, limit = 20) {
    const { role, search, is_active } = filters;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.*, r.role_name, uc.balance as coins_balance
      FROM Users u
      JOIN Roles r ON u.role_id = r.role_id
      LEFT JOIN UserCoins uc ON u.user_id = uc.user_id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += " AND r.role_name = ?";
      params.push(role);
    }

    if (is_active !== undefined && is_active !== "") {
      query += " AND u.is_active = ?";
      params.push(is_active === "true");
    }

    if (search) {
      query += " AND (u.full_name LIKE ? OR u.email LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace(
      /SELECT u\.\*, r\.role_name, uc\.balance as coins_balance/,
      "SELECT COUNT(*) as total"
    );
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    query += " ORDER BY u.user_id ASC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await pool.query(query, params);

    // Remove sensitive data
    const safeUsers = users.map(({ password_hash, ...user }) => user);

    return {
      users: safeUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get user by ID
  static async getUserById(userId) {
    const [users] = await pool.query(
      `SELECT u.*, r.role_name, uc.balance as coins_balance
       FROM Users u
       JOIN Roles r ON u.role_id = r.role_id
       LEFT JOIN UserCoins uc ON u.user_id = uc.user_id
       WHERE u.user_id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return null;
    }

    const { password_hash, ...user } = users[0];
    return user;
  }

  // Create user
  static async createUser(userData) {
    const { full_name, email, password_hash, phone, role_id } = userData;

    const [result] = await pool.query(
      `INSERT INTO Users (full_name, email, password_hash, phone, role_id, is_active) 
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [full_name, email, password_hash, phone || null, role_id]
    );

    // Initialize coins
    await pool.query("INSERT INTO UserCoins (user_id, balance) VALUES (?, 0)", [
      result.insertId,
    ]);

    return result.insertId;
  }

  // Update user
  static async updateUser(userId, updates) {
    const fields = [];
    const values = [];

    const validFields = [
      "full_name",
      "email",
      "password_hash",
      "phone",
      "role_id",
      "is_active",
    ];

    Object.keys(updates).forEach((key) => {
      if (
        key !== "user_id" &&
        updates[key] !== undefined &&
        validFields.includes(key)
      ) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      return 0;
    }

    values.push(userId);

    const [result] = await pool.query(
      `UPDATE Users SET ${fields.join(", ")} WHERE user_id = ?`,
      values
    );

    return result.affectedRows;
  }

  // Delete user (soft delete by setting is_active to false)
  static async deleteUser(userId) {
    const [result] = await pool.query(
      "UPDATE Users SET is_active = FALSE WHERE user_id = ?",
      [userId]
    );

    return result.affectedRows;
  }

  // Change user role
  static async changeUserRole(userId, roleId) {
    const [result] = await pool.query(
      "UPDATE Users SET role_id = ? WHERE user_id = ?",
      [roleId, userId]
    );

    return result.affectedRows;
  }

  // Check if email exists
  static async emailExists(email, excludeUserId = null) {
    let query = "SELECT user_id FROM Users WHERE email = ?";
    const params = [email];

    if (excludeUserId) {
      query += " AND user_id != ?";
      params.push(excludeUserId);
    }

    const [users] = await pool.query(query, params);
    return users.length > 0;
  }

  // Get user by email
  static async getUserByEmail(email) {
    const [users] = await pool.query(
      `SELECT u.*, r.role_name 
       FROM Users u 
       JOIN Roles r ON u.role_id = r.role_id 
       WHERE u.email = ? AND u.is_active = TRUE`,
      [email]
    );

    return users.length > 0 ? users[0] : null;
  }

  // Update user coins
  static async updateUserCoins(userId, amount, type = "add") {
    const operation = type === "add" ? "+" : "-";

    const [result] = await pool.query(
      `UPDATE UserCoins 
       SET balance = balance ${operation} ?, 
           ${type === "add"
        ? "earned_total = earned_total + ?"
        : "spent_total = spent_total + ?"
      } 
       WHERE user_id = ?`,
      [Math.abs(amount), Math.abs(amount), userId]
    );

    return result.affectedRows;
  }

  // Get user coins
  static async getUserCoins(userId) {
    const [coins] = await pool.query(
      "SELECT * FROM UserCoins WHERE user_id = ?",
      [userId]
    );

    return coins.length > 0 ? coins[0] : null;
  }
}
