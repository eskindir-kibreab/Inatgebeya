import pool from "../config/db.js";

export class ProductService {
  // Get all products with filters and pagination
  // Get all products with filters and pagination
  static async getAllProducts(filters = {}, page = 1, limit = 20) {
    const {
      category_id,
      shop_id,
      min_price,
      max_price,
      search,
      is_active,
    } = filters;
    const offset = (page - 1) * limit;

    let query = `
    SELECT p.*, pc.category_name, s.shop_name, u.full_name as creator_name
    FROM Products p
    JOIN ProductCategories pc ON p.category_id = pc.category_id
    JOIN Shops s ON p.shop_id = s.shop_id
    JOIN Users u ON p.created_by = u.user_id
    WHERE 1=1
  `;
    const params = [];

    // Handle is_active filter
    if (is_active !== undefined && is_active !== "") {
      // Explicit filter provided
      const activeStatus = is_active === "true" || is_active === true;
      query += " AND p.is_active = ?";
      params.push(activeStatus);
    } else if (filters.include_inactive !== true) {
      // Default for non-admins: show only active products
      query += " AND p.is_active = TRUE";
    }
    // If include_inactive is true, we don't add the is_active filter at all, showing everything

    if (category_id) {
      query += " AND p.category_id = ?";
      params.push(category_id);
    }

    if (shop_id) {
      query += " AND p.shop_id = ?";
      params.push(shop_id);
    }

    if (min_price) {
      query += " AND p.price >= ?";
      params.push(min_price);
    }

    if (max_price) {
      query += " AND p.price <= ?";
      params.push(max_price);
    }

    if (search) {
      query += " AND (p.product_name LIKE ? OR p.description LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace(
      /SELECT p\.\*, pc\.category_name, s\.shop_name, u\.full_name as creator_name/,
      "SELECT COUNT(*) as total"
    );
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add sorting and pagination
    query += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await pool.query(query, params);

    // Get sizes for each product
    for (const product of products) {
      const [sizes] = await pool.query(
        "SELECT * FROM ProductSizes WHERE product_id = ? AND is_active = TRUE",
        [product.product_id]
      );
      product.sizes = sizes;

      const [images] = await pool.query(
        "SELECT image_url FROM ProductImages WHERE product_id = ?",
        [product.product_id]
      );
      product.images = images.map((img) => img.image_url);

      // Get average rating
      const [rating] = await pool.query(
        "SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM Ratings WHERE product_id = ?",
        [product.product_id]
      );
      product.avg_rating = rating[0].avg_rating || 0;
      product.review_count = rating[0].review_count || 0;
    }

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
  // Get product by ID
  static async getProductById(productId) {
    const [products] = await pool.query(
      `SELECT p.*, pc.category_name, s.shop_name, u.full_name as creator_name
       FROM Products p
       JOIN ProductCategories pc ON p.category_id = pc.category_id
       JOIN Shops s ON p.shop_id = s.shop_id
       JOIN Users u ON p.created_by = u.user_id
       WHERE p.product_id = ?`,
      [productId]
    );

    if (products.length === 0) {
      return null;
    }

    const product = products[0];

    // Get sizes
    const [sizes] = await pool.query(
      "SELECT * FROM ProductSizes WHERE product_id = ? AND is_active = TRUE",
      [productId]
    );
    product.sizes = sizes;

    // Get images
    const [images] = await pool.query(
      "SELECT image_url FROM ProductImages WHERE product_id = ?",
      [productId]
    );
    product.images = images.map((img) => img.image_url);

    // Get ratings
    const [ratings] = await pool.query(
      `SELECT r.*, u.full_name as user_name
       FROM Ratings r
       JOIN Users u ON r.user_id = u.user_id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [productId]
    );
    product.ratings = ratings;

    // Get average rating
    const [ratingStats] = await pool.query(
      "SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM Ratings WHERE product_id = ?",
      [productId]
    );
    product.avg_rating = ratingStats[0].avg_rating || 0;
    product.review_count = ratingStats[0].review_count || 0;

    return product;
  }

  // Create product
  static async createProduct(productData) {
    const {
      product_name,
      category_id,
      shop_id,
      price,
      description,
      main_image,
      created_by,
    } = productData;

    const [result] = await pool.query(
      `INSERT INTO Products (product_name, category_id, shop_id, price, description, main_image, created_by, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        product_name,
        category_id,
        shop_id,
        price,
        description,
        main_image,
        created_by,
      ]
    );

    return result.insertId;
  }

  // Update product
  static async updateProduct(productId, updates) {
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

    values.push(productId);

    const [result] = await pool.query(
      `UPDATE Products SET ${fields.join(", ")} WHERE product_id = ?`,
      values
    );

    return result.affectedRows;
  }

  // Delete product
  static async deleteProduct(productId) {
    const [result] = await pool.query(
      "DELETE FROM Products WHERE product_id = ?",
      [productId]
    );

    return result.affectedRows;
  }

  // Toggle product active status
  static async toggleProductStatus(productId, isActive) {
    const [result] = await pool.query(
      "UPDATE Products SET is_active = ? WHERE product_id = ?",
      [isActive, productId]
    );

    return result.affectedRows;
  }

  // Add product image
  static async addProductImage(productId, imageUrl) {
    const [result] = await pool.query(
      "INSERT INTO ProductImages (product_id, image_url) VALUES (?, ?)",
      [productId, imageUrl]
    );

    return result.insertId;
  }

  // Remove product image
  static async removeProductImage(imageId) {
    const [result] = await pool.query(
      "DELETE FROM ProductImages WHERE image_id = ?",
      [imageId]
    );

    return result.affectedRows;
  }

  // Add product size
  static async addProductSize(sizeData) {
    const { product_id, size_label, stock } = sizeData;

    const [result] = await pool.query(
      "INSERT INTO ProductSizes (product_id, size_label, stock) VALUES (?, ?, ?)",
      [product_id, size_label, stock]
    );

    return result.insertId;
  }

  // Update product size
  static async updateProductSize(sizeId, updates) {
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

    values.push(sizeId);

    const [result] = await pool.query(
      `UPDATE ProductSizes SET ${fields.join(", ")} WHERE size_id = ?`,
      values
    );

    return result.affectedRows;
  }

  // Update product stock
  static async updateProductStock(productId, sizeId, stock) {
    let query;
    let params;

    if (sizeId) {
      // Update specific size stock
      query =
        "UPDATE ProductSizes SET stock = ? WHERE size_id = ? AND product_id = ?";
      params = [stock, sizeId, productId];
    } else {
      // Update main product stock (if no sizes)
      query = "UPDATE Products SET stock = ? WHERE product_id = ?";
      params = [stock, productId];
    }

    const [result] = await pool.query(query, params);
    return result.affectedRows;
  }

  // Check if product belongs to shop
  static async productBelongsToShop(productId, shopId) {
    const [products] = await pool.query(
      "SELECT product_id FROM Products WHERE product_id = ? AND shop_id = ?",
      [productId, shopId]
    );

    return products.length > 0;
  }

  // Get product sizes
  static async getProductSizes(productId) {
    const [sizes] = await pool.query(
      "SELECT * FROM ProductSizes WHERE product_id = ? AND is_active = TRUE",
      [productId]
    );

    return sizes;
  }

  // Add rating
  static async addRating(ratingData) {
    const { product_id, user_id, rating, review } = ratingData;

    // Check if user already rated this product
    const [existing] = await pool.query(
      "SELECT rating_id FROM Ratings WHERE product_id = ? AND user_id = ?",
      [product_id, user_id]
    );

    if (existing.length > 0) {
      // Update existing rating
      const [result] = await pool.query(
        "UPDATE Ratings SET rating = ?, review = ? WHERE rating_id = ?",
        [rating, review, existing[0].rating_id]
      );
      return { updated: true, id: existing[0].rating_id };
    } else {
      // Create new rating
      const [result] = await pool.query(
        "INSERT INTO Ratings (product_id, user_id, rating, review) VALUES (?, ?, ?, ?)",
        [product_id, user_id, rating, review]
      );
      return { updated: false, id: result.insertId };
    }
  }

  // Search products
  static async searchProducts(searchTerm, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const searchPattern = `%${searchTerm}%`;

    const [products] = await pool.query(
      `SELECT p.*, pc.category_name, s.shop_name
       FROM Products p
       JOIN ProductCategories pc ON p.category_id = pc.category_id
       JOIN Shops s ON p.shop_id = s.shop_id
       WHERE p.is_active = TRUE 
       AND (p.product_name LIKE ? OR p.description LIKE ? OR pc.category_name LIKE ?)
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [
        searchPattern,
        searchPattern,
        searchPattern,
        parseInt(limit),
        parseInt(offset),
      ]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total
       FROM Products p
       JOIN ProductCategories pc ON p.category_id = pc.category_id
       WHERE p.is_active = TRUE 
       AND (p.product_name LIKE ? OR p.description LIKE ? OR pc.category_name LIKE ?)`,
      [searchPattern, searchPattern, searchPattern]
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
}
