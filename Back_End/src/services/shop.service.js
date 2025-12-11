import pool from "../config/db.js";

export class ShopService {
  // Get all shops with filters and pagination
  static async getAllShops(filters = {}, page = 1, limit = 20) {
    const { area_id, search, owner_id } = filters;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, a.area_name, u.full_name as owner_name, u.email as owner_email
      FROM Shops s
      JOIN Areas a ON s.area_id = a.area_id
      JOIN Users u ON s.owner_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (area_id) {
      query += " AND s.area_id = ?";
      params.push(area_id);
    }

    if (owner_id) {
      query += " AND s.owner_id = ?";
      params.push(owner_id);
    }

    if (search) {
      query += " AND (s.shop_name LIKE ? OR a.area_name LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace(
      /SELECT s\.\*, a\.area_name, u\.full_name as owner_name, u\.email as owner_email/,
      "SELECT COUNT(*) as total"
    );
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    query += " ORDER BY s.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [shops] = await pool.query(query, params);

    return {
      shops,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get shop by ID
  static async getShopById(shopId) {
    const [shops] = await pool.query(
      `SELECT s.*, a.area_name, u.full_name as owner_name, u.email as owner_email
       FROM Shops s
       JOIN Areas a ON s.area_id = a.area_id
       JOIN Users u ON s.owner_id = u.user_id
       WHERE s.shop_id = ?`,
      [shopId]
    );

    return shops.length > 0 ? shops[0] : null;
  }

  // Create shop
  static async createShop(shopData) {
    const { shop_name, owner_id, area_id } = shopData;

    const [result] = await pool.query(
      "INSERT INTO Shops (shop_name, owner_id, area_id) VALUES (?, ?, ?)",
      [shop_name, owner_id, area_id]
    );

    return result.insertId;
  }

  // Update shop
  static async updateShop(shopId, updates) {
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

    values.push(shopId);

    const [result] = await pool.query(
      `UPDATE Shops SET ${fields.join(", ")} WHERE shop_id = ?`,
      values
    );

    return result.affectedRows;
  }

  // Delete shop
  static async deleteShop(shopId) {
    const [result] = await pool.query("DELETE FROM Shops WHERE shop_id = ?", [
      shopId,
    ]);

    return result.affectedRows;
  }

  // Get shop by owner ID
  static async getShopByOwnerId(ownerId) {
    const [shops] = await pool.query(
      `SELECT s.*, a.area_name
       FROM Shops s
       JOIN Areas a ON s.area_id = a.area_id
       WHERE s.owner_id = ?`,
      [ownerId]
    );

    return shops.length > 0 ? shops[0] : null;
  }

  // Get shop products
  static async getShopProducts(shopId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [products] = await pool.query(
      `SELECT p.*, pc.category_name
       FROM Products p
       JOIN ProductCategories pc ON p.category_id = pc.category_id
       WHERE p.shop_id = ? AND p.is_active = TRUE
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [shopId, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM Products WHERE shop_id = ? AND is_active = TRUE",
      [shopId]
    );

    const total = countResult[0].total;

    return {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get shop analytics
  static async getShopAnalytics(shopId) {
    // Total products
    const [productCount] = await pool.query(
      "SELECT COUNT(*) as total FROM Products WHERE shop_id = ?",
      [shopId]
    );

    // Active products
    const [activeCount] = await pool.query(
      "SELECT COUNT(*) as active FROM Products WHERE shop_id = ? AND is_active = TRUE",
      [shopId]
    );

    // Total orders
    const [orderCount] = await pool.query(
      "SELECT COUNT(*) as total_orders FROM Orders WHERE shop_id = ?",
      [shopId]
    );

    // Total sales
    const [salesResult] = await pool.query(
      'SELECT COALESCE(SUM(total), 0) as total_sales FROM Orders WHERE shop_id = ? AND status IN ("delivered", "completed")',
      [shopId]
    );

    // Recent orders
    const [recentOrders] = await pool.query(
      `SELECT o.*, u.full_name as customer_name
       FROM Orders o
       JOIN Users u ON o.user_id = u.user_id
       WHERE o.shop_id = ?
       ORDER BY o.created_at DESC
       LIMIT 10`,
      [shopId]
    );

    // Product sales by category
    const [categorySales] = await pool.query(
      `SELECT pc.category_name, COUNT(oi.order_item_id) as items_sold
       FROM OrderItems oi
       JOIN Products p ON oi.product_id = p.product_id
       JOIN ProductCategories pc ON p.category_id = pc.category_id
       JOIN Orders o ON oi.order_id = o.order_id
       WHERE p.shop_id = ? AND o.status IN ("delivered", "completed")
       GROUP BY pc.category_id
       ORDER BY items_sold DESC`,
      [shopId]
    );

    return {
      summary: {
        total_products: productCount[0].total,
        active_products: activeCount[0].active,
        total_orders: orderCount[0].total_orders,
        total_sales: salesResult[0].total_sales,
      },
      recent_orders: recentOrders,
      category_sales: categorySales,
    };
  }

  // Check if shop name exists
  static async shopNameExists(shopName, excludeShopId = null) {
    let query = "SELECT shop_id FROM Shops WHERE shop_name = ?";
    const params = [shopName];

    if (excludeShopId) {
      query += " AND shop_id != ?";
      params.push(excludeShopId);
    }

    const [shops] = await pool.query(query, params);
    return shops.length > 0;
  }
}
