import pool from "../config/db.js";
import { validationResult } from "express-validator";
import { ProductService } from "../services/product.service.js";

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      category_id,
      shop_id,
      min_price,
      max_price,
      search,
      is_active,
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 5;

    const isAdmin = req.user && ["super_admin", "admin", "item_adder_admin", "shop_owner"].includes(req.user.role_name);

    const result = await ProductService.getAllProducts(
      {
        category_id,
        shop_id,
        min_price,
        max_price,
        search,
        is_active,
        include_inactive: isAdmin && !is_active
      },
      pageNum,
      limitNum
    );

    const finalProducts = result.products.slice(0, limitNum);
    const finalTotal = result.pagination.total;

    res.json({
      success: true,
      data: finalProducts,
      pagination: {
        ...result.pagination,
        total: finalTotal,
        pages: Math.ceil(finalTotal / limitNum)
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductService.getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

// Create product
export const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { product_name, category_id, shop_id, price, description } = req.body;

  const main_image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const productId = await ProductService.createProduct({
      product_name,
      category_id,
      shop_id,
      price,
      description,
      main_image,
      created_by: req.user.user_id,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { productId },
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Product Update Validation Errors:", errors.array());
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const updates = { ...req.body };

  console.log("Updating product ID:", id, "with data:", updates);

  try {
    // Check if product belongs to user's shop (for shop owners)
    if (req.user.role_name === "shop_owner") {
      const belongs = await ProductService.productBelongsToShop(
        id,
        req.user.shop_id
      );
      if (!belongs) {
        return res.status(403).json({
          success: false,
          message: "You can only update products in your own shop",
        });
      }
    }

    // Handle image upload
    if (req.file) {
      updates.main_image = `/uploads/${req.file.filename}`;
    }

    const affectedRows = await ProductService.updateProduct(id, updates);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found or no changes made",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user.role_name === "shop_owner") {
      const belongs = await ProductService.productBelongsToShop(
        id,
        req.user.shop_id
      );
      if (!belongs) {
        return res.status(403).json({
          success: false,
          message: "You can only delete products in your own shop",
        });
      }
    }

    const affectedRows = await ProductService.deleteProduct(id);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    // Handle foreign key constraint (product has orders)
    if (error.errno === 1451) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete this product because it has been ordered. Please deactivate it instead.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

// Toggle product status
export const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "is_active must be a boolean value",
      });
    }

    // Check permissions for shop owner
    if (req.user.role_name === "shop_owner") {
      const belongs = await ProductService.productBelongsToShop(
        id,
        req.user.shop_id
      );
      if (!belongs) {
        return res.status(403).json({
          success: false,
          message: "You can only update products in your own shop",
        });
      }
    }

    const affectedRows = await ProductService.toggleProductStatus(
      id,
      is_active
    );

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: `Product ${is_active ? "activated" : "deactivated"
        } successfully`,
    });
  } catch (error) {
    console.error("Toggle product status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product status",
    });
  }
};

// Update product stock
export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { size_id, stock } = req.body;

    if (!stock && stock !== 0) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity is required",
      });
    }

    const affectedRows = await ProductService.updateProductStock(
      id,
      size_id,
      stock
    );

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product or size not found",
      });
    }

    res.json({
      success: true,
      message: "Stock updated successfully",
    });
  } catch (error) {
    console.error("Update stock error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update stock",
    });
  }
};

// Add product image
export const addProductImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const imageId = await ProductService.addProductImage(id, imageUrl);

    res.status(201).json({
      success: true,
      message: "Image added successfully",
      data: { imageId, imageUrl },
    });
  } catch (error) {
    console.error("Add product image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add product image",
    });
  }
};

// Add product size
export const addProductSize = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const { size_label, stock } = req.body;

  try {
    const sizeId = await ProductService.addProductSize({
      product_id: id,
      size_label,
      stock: stock || 0,
    });

    res.status(201).json({
      success: true,
      message: "Size added successfully",
      data: { sizeId },
    });
  } catch (error) {
    console.error("Add product size error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add product size",
    });
  }
};

// Rate product
export const rateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const { rating, review } = req.body;

  try {
    // Check if user has purchased this product (optional validation)
    // You can add this check if needed

    const result = await ProductService.addRating({
      product_id: id,
      user_id: req.user.user_id,
      rating,
      review,
    });

    res.json({
      success: true,
      message: `Product ${result.updated ? "rating updated" : "rated"
        } successfully`,
      data: { ratingId: result.id },
    });
  } catch (error) {
    console.error("Rate product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to rate product",
    });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 5 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search term must be at least 2 characters",
      });
    }

    const result = await ProductService.searchProducts(q.trim(), page, limit);

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Search products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search products",
    });
  }
};

// Get product sizes
export const getProductSizes = async (req, res) => {
  try {
    const { id } = req.params;
    const sizes = await ProductService.getProductSizes(id);

    res.json({
      success: true,
      data: sizes,
    });
  } catch (error) {
    console.error("Get product sizes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product sizes",
    });
  }
};
