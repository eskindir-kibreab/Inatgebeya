import express from "express";
import { body, param, query } from "express-validator";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import {
  authMiddleware,
  requirePermission,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Validation rules
const categoryValidation = [
  body("category_name").notEmpty().withMessage("Category name is required"),
];

// Public routes
router.get("/", [query("stats").optional().isBoolean()], getAllCategories);

router.get("/:id", [param("id").isInt()], getCategoryById);

// Protected routes (Admin, Super Admin, ItemAdderAdmin)
router.use(authMiddleware);

router.post(
  "/",
  requirePermission("item_adder_admin"),
  categoryValidation,
  createCategory
);

router.put(
  "/:id",
  [param("id").isInt(), ...categoryValidation],
  requirePermission("item_adder_admin"),
  updateCategory
);

router.delete(
  "/:id",
  [param("id").isInt()],
  requirePermission("admin"),
  deleteCategory
);

export default router;
