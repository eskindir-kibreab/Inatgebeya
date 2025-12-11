import express from "express";
import { body, param, query } from "express-validator";
import {
  getAllShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
  getMyShop,
  getShopProducts,
  getShopAnalytics,
} from "../controllers/shop.controller.js";
import {
  authMiddleware,
  requireRole,
  requirePermission,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Validation rules
const shopValidation = [
  body("shop_name").notEmpty().withMessage("Shop name is required"),
  body("owner_id").isInt().withMessage("Valid owner ID is required"),
  body("area_id").isInt().withMessage("Valid area ID is required"),
];

// Routes

// Public routes
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("area_id").optional().isInt(),
    query("search").optional().isString().trim(),
  ],
  getAllShops
);

router.get("/:id", [param("id").isInt()], getShopById);

router.get(
  "/:id/products",
  [
    param("id").isInt(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  getShopProducts
);

// Protected routes
router.use(authMiddleware);

// Shop owner routes
router.get("/my/shop", requireRole("shop_owner"), getMyShop);

// Admin routes
router.post("/", requirePermission("admin"), shopValidation, createShop);

router.put(
  "/:id",
  [
    param("id").isInt(),
    body("shop_name").optional().notEmpty(),
    body("area_id").optional().isInt(),
  ],
  requireRole("super_admin", "admin", "shop_owner"),
  updateShop
);

router.delete(
  "/:id",
  [param("id").isInt()],
  requirePermission("admin"),
  deleteShop
);

router.get(
  "/:id/analytics",
  [param("id").isInt()],
  requireRole("super_admin", "admin", "shop_owner"),
  getShopAnalytics
);

export default router;
