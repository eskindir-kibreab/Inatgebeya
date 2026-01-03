import express from "express";
import { body, param, query } from "express-validator";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  updateProductStock,
  addProductImage,
  addProductSize,
  rateProduct,
  searchProducts,
  getProductSizes,
} from "../controllers/product.controller.js";
import {
  authMiddleware,
  optionalAuth,
  requireRole,
  requirePermission,
} from "../middlewares/auth.middleware.js";
import {
  uploadSingle,
  handleUploadError,
} from "../middlewares/upload.middleware.js";

const router = express.Router();

// Validation rules
const productValidation = [
  body("product_name").notEmpty().withMessage("Product name is required"),
  body("category_id").isInt().withMessage("Valid category ID is required"),
  body("shop_id").isInt().withMessage("Valid shop ID is required"),
  body("price").isFloat({ gt: 0 }).withMessage("The price must be a positive number"),
  body("description").optional().isString(),
];

const sizeValidation = [
  body("size_label").notEmpty().withMessage("Size label is required"),
  body("stock").optional().isInt({ min: 0 }),
];

const ratingValidation = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("review").optional().isString(),
];

// Public routes
router.get(
  "/",
  optionalAuth,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("category_id").optional().isInt(),
    query("shop_id").optional().isInt(),
    query("min_price").optional().isFloat({ min: 0 }),
    query("max_price").optional().isFloat({ min: 0 }),
    query("search").optional().isString().trim(),
    query("is_active").optional().isBoolean(),
  ],
  getAllProducts
);

router.get(
  "/search",
  [
    query("q").notEmpty().withMessage("Search query is required"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  searchProducts
);

router.get("/:id", [param("id").isInt()], getProductById);

router.get("/:id/sizes", [param("id").isInt()], getProductSizes);

// Protected routes
router.use(authMiddleware);

// User routes
router.post(
  "/:id/rate",
  [param("id").isInt(), ...ratingValidation],
  requireRole("user"),
  rateProduct
);

// Shop owner routes
router.put(
  "/:id/toggle",
  [param("id").isInt(), body("is_active").isBoolean()],
  requireRole("super_admin", "admin", "item_adder_admin", "shop_owner"),
  toggleProductStatus
);

// Item adder admin & admin routes
router.post(
  "/",
  requireRole("super_admin", "admin", "item_adder_admin", "shop_owner"),
  uploadSingle("main_image"),
  handleUploadError,
  productValidation,
  createProduct
);

router.post(
  "/:id/images",
  [param("id").isInt()],
  requireRole("super_admin", "admin", "item_adder_admin", "shop_owner"),
  uploadSingle("image"),
  handleUploadError,
  addProductImage
);

router.post(
  "/:id/sizes",
  [param("id").isInt(), ...sizeValidation],
  requireRole("super_admin", "admin", "item_adder_admin", "shop_owner"),
  addProductSize
);

router.put(
  "/:id/stock",
  [
    param("id").isInt(),
    body("size_id").optional().isInt(),
    body("stock").isInt({ min: 0 }),
  ],
  requireRole("super_admin", "admin", "item_adder_admin", "shop_owner"),
  updateProductStock
);

// Admin & item adder admin routes
router.put(
  "/:id",
  [
    param("id").isInt(),
    body("product_name").optional().notEmpty(),
    body("category_id").optional().isInt(),
    body("price").optional().isFloat({ gt: 0 }).withMessage("The price must be a positive number"),
    body("description").optional().isString(),
    body("is_active").optional().toBoolean().isBoolean(),
  ],
  requireRole("super_admin", "admin", "item_adder_admin", "shop_owner"),
  uploadSingle("main_image"),
  handleUploadError,
  updateProduct
);

// Admin only routes
router.delete(
  "/:id",
  [param("id").isInt()],
  requirePermission("admin"),
  deleteProduct
);

export default router;
