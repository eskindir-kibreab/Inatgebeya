import { validationResult } from "express-validator";
import { CategoryService } from "../services/category.service.js";

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const withStats = req.query.stats === "true";
    const shopId = req.query.shop_id;

    let categories;
    if (withStats) {
      categories = await CategoryService.getAllCategoriesWithStats(shopId);
    } else {
      categories = await CategoryService.getAllCategories();
    }

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await CategoryService.getCategoryById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
    });
  }
};

// Create category
export const createCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { category_name } = req.body;

  try {
    // Check if category name already exists
    const categoryExists = await CategoryService.categoryNameExists(
      category_name
    );
    if (categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Category name already exists",
      });
    }

    const categoryId = await CategoryService.createCategory({ category_name });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { categoryId },
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const { category_name } = req.body;

  try {
    // Check if category name already exists
    const categoryExists = await CategoryService.categoryNameExists(
      category_name,
      id
    );
    if (categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Category name already exists",
      });
    }

    const affectedRows = await CategoryService.updateCategory(id, {
      category_name,
    });

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found or no changes made",
      });
    }

    res.json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const affectedRows = await CategoryService.deleteCategory(id);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);

    if (error.message === "Cannot delete category with existing products") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};
