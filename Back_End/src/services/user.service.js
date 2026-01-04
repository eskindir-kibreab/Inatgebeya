import pool from "../config/db.js";

export class UserService {
  // Get all users with filters and pagination
  static async getAllUsers(filters = {}, page = 1, limit = 20) {
    const { role, search, is_active } = filters;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.*, r.role_name, uc.balance as coins_balance,
             ui.fan_number, ui.id_image_url
      FROM Users u
      JOIN Roles r ON u.role_id = r.role_id
      LEFT JOIN UserCoins uc ON u.user_id = uc.user_id
      LEFT JOIN UserIdentifications ui ON u.user_id = ui.user_id
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
    const safeUsers = users.map(({ password_hash, fan_number, id_image_url, ...user }) => ({
      ...user,
      identification: (fan_number || id_image_url) ? { fan_number, id_image_url } : null,
    }));

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
      `SELECT u.*, r.role_name, uc.balance as coins_balance,
              ui.fan_number, ui.id_image_url
       FROM Users u
       JOIN Roles r ON u.role_id = r.role_id
       LEFT JOIN UserCoins uc ON u.user_id = uc.user_id
       LEFT JOIN UserIdentifications ui ON u.user_id = ui.user_id
       WHERE u.user_id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return null;
    }

    const { password_hash, fan_number, id_image_url, ...userData } = users[0];
    return {
      ...userData,
      identification: (fan_number || id_image_url) ? { fan_number, id_image_url } : null,
    };
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

  // Force delete user (hard delete with cascading cleanup)
  static async forceDeleteUser(userId) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Tokens and Resets
      await connection.query("DELETE FROM usertokens WHERE user_id = ?", [userId]);
      await connection.query("DELETE FROM passwordresets WHERE user_id = ?", [userId]);
      await connection.query("DELETE FROM UserCoins WHERE user_id = ?", [userId]);

      // 2. Ratings (by user)
      await connection.query("DELETE FROM Ratings WHERE user_id = ?", [userId]);

      // 3. User's Orders cleanup
      // Delete Returns for User's OrderItems
      await connection.query(
        `DELETE FROM ReturnedItems WHERE order_item_id IN (
          SELECT order_item_id FROM OrderItems WHERE order_id IN (
            SELECT order_id FROM Orders WHERE user_id = ?
          )
        )`,
        [userId]
      );
      // Delete OrderItems for User's Orders
      await connection.query(
        "DELETE FROM OrderItems WHERE order_id IN (SELECT order_id FROM Orders WHERE user_id = ?)",
        [userId]
      );
      // Delete DeliveryAssignments for User's Orders
      await connection.query(
        "DELETE FROM DeliveryOrders WHERE order_id IN (SELECT order_id FROM Orders WHERE user_id = ?)",
        [userId]
      );
      // Delete User's Orders
      await connection.query("DELETE FROM Orders WHERE user_id = ?", [userId]);

      // 4. Shop-related data (if User is a Shop Owner)
      const [shops] = await connection.query("SELECT shop_id FROM Shops WHERE owner_id = ?", [userId]);
      if (shops.length > 0) {
        const shopIds = shops.map(s => s.shop_id);
        // Delete Returns for Shop's Product's OrderItems
        await connection.query(
          `DELETE FROM ReturnedItems WHERE order_item_id IN (
            SELECT order_item_id FROM OrderItems WHERE product_id IN (
              SELECT product_id FROM Products WHERE shop_id IN (?)
            )
          )`,
          [shopIds]
        );
        // Delete OrderItems for Shop's Products
        await connection.query(
          "DELETE FROM OrderItems WHERE product_id IN (SELECT product_id FROM Products WHERE shop_id IN (?))",
          [shopIds]
        );
        // Delete Ratings for Shop's Products
        await connection.query(
          "DELETE FROM Ratings WHERE product_id IN (SELECT product_id FROM Products WHERE shop_id IN (?))",
          [shopIds]
        );
        // Delete Images and Sizes
        await connection.query(
          "DELETE FROM ProductImages WHERE product_id IN (SELECT product_id FROM Products WHERE shop_id IN (?))",
          [shopIds]
        );
        await connection.query(
          "DELETE FROM ProductSizes WHERE product_id IN (SELECT product_id FROM Products WHERE shop_id IN (?))",
          [shopIds]
        );
        // Delete Products
        await connection.query("DELETE FROM Products WHERE shop_id IN (?)", [shopIds]);
        // Delete Shops
        await connection.query("DELETE FROM Shops WHERE owner_id = ?", [userId]);
      }

      // 5. Delivery Person cleanup
      await connection.query(
        "DELETE FROM DeliveryOrders WHERE delivery_person_id IN (SELECT delivery_person_id FROM DeliveryPersons WHERE user_id = ?)",
        [userId]
      );
      await connection.query("DELETE FROM DeliveryPersons WHERE user_id = ?", [userId]);

      // 6. Finally delete the user record
      const [result] = await connection.query("DELETE FROM Users WHERE user_id = ?", [userId]);

      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
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

  // Update National ID image
  static async updateNationalIDImage(userId, imageUrl) {
    // Check if identification record exists
    const [existing] = await pool.query(
      "SELECT id FROM UserIdentifications WHERE user_id = ?",
      [userId]
    );

    if (existing.length > 0) {
      const [result] = await pool.query(
        "UPDATE UserIdentifications SET id_image_url = ? WHERE user_id = ?",
        [imageUrl, userId]
      );
      return result.affectedRows;
    } else {
      // Create a minimal record if it doesn't exist (though fan_number is normally required)
      // Note: This helps backward compatibility for older users
      const [result] = await pool.query(
        "INSERT INTO UserIdentifications (user_id, id_image_url, fan_number) VALUES (?, ?, 'NOT_PROVIDED')",
        [userId, imageUrl]
      );
      return result.affectedRows;
    }
  }
}
