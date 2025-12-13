import pool from "../config/db.js";

export class CategoryService {
  // Get all categories
  static async getAllCategories() {
    const [categories] = await pool.query(
      "SELECT * FROM ProductCategories ORDER BY category_name"
    );
    return categories;
  }

  // Get category by ID
  static async getCategoryById(categoryId) {
    const [categories] = await pool.query(
      "SELECT * FROM ProductCategories WHERE category_id = ?",
      [categoryId]
    );
    return categories.length > 0 ? categories[0] : null;
  }

  // Create category
  static async createCategory(categoryData) {
    const { category_name } = categoryData;

    const [result] = await pool.query(
      "INSERT INTO ProductCategories (category_name) VALUES (?)",
      [category_name]
    );

    return result.insertId;
  }

  // Update category
  static async updateCategory(categoryId, updates) {
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

    values.push(categoryId);

    const [result] = await pool.query(
      `UPDATE ProductCategories SET ${fields.join(", ")} WHERE category_id = ?`,
      values
    );

    return result.affectedRows;
  }

  // Delete category
  static async deleteCategory(categoryId) {
    // Check if category has products
    const [products] = await pool.query(
      "SELECT COUNT(*) as product_count FROM Products WHERE category_id = ?",
      [categoryId]
    );

    if (products[0].product_count > 0) {
      throw new Error("Cannot delete category with existing products");
    }

    const [result] = await pool.query(
      "DELETE FROM ProductCategories WHERE category_id = ?",
      [categoryId]
    );

    return result.affectedRows;
  }

  // Check if category name exists
  static async categoryNameExists(categoryName, excludeCategoryId = null) {
    let query =
      "SELECT category_id FROM ProductCategories WHERE category_name = ?";
    const params = [categoryName];

    if (excludeCategoryId) {
      query += " AND category_id != ?";
      params.push(excludeCategoryId);
    }

    const [categories] = await pool.query(query, params);
    return categories.length > 0;
  }

  // Get category with product count
  static async getCategoryWithStats(categoryId) {
    const [categories] = await pool.query(
      `SELECT pc.*, COUNT(p.product_id) as product_count
       FROM ProductCategories pc
       LEFT JOIN Products p ON pc.category_id = p.category_id AND p.is_active = TRUE
       WHERE pc.category_id = ?
       GROUP BY pc.category_id`,
      [categoryId]
    );

    if (categories.length === 0) {
      return null;
    }

    return categories[0];
  }

  // Get all categories with product counts
  static async getAllCategoriesWithStats() {
    const [categories] = await pool.query(
      `SELECT pc.*, COUNT(p.product_id) as product_count
       FROM ProductCategories pc
       LEFT JOIN Products p ON pc.category_id = p.category_id AND p.is_active = TRUE
       GROUP BY pc.category_id
       ORDER BY pc.category_name`
    );

    return categories;
  }
}
