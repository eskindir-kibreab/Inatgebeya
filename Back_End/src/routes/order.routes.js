import express from "express";
import { body, param, query } from "express-validator";
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getMyOrders,
  requestReturn,
} from "../controllers/order.controller.js";
import {
  authMiddleware,
  requireRole,
  requirePermission,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Validation rules
const orderValidation = [
  body("shop_id").isInt().withMessage("Valid shop ID is required"),
  body("delivery_address")
    .notEmpty()
    .withMessage("Delivery address is required"),
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),
  body("items.*.product_id")
    .isInt()
    .withMessage("Valid product ID is required"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("items.*.price")
    .isFloat({ min: 0 })
    .withMessage("Valid price is required"),
  body("items.*.size_id").optional().isInt(),
];

const returnValidation = [
  body("order_item_id").isInt().withMessage("Valid order item ID is required"),
  body("return_reason").notEmpty().withMessage("Return reason is required"),
];

// Protected routes
router.use(authMiddleware);

// User routes
router.get(
  "/my-orders",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  requireRole("user"),
  getMyOrders
);

router.post("/", requireRole("user"), orderValidation, createOrder);

router.post(
  "/:id/cancel",
  [param("id").isInt()],
  requireRole("user", "super_admin", "admin"),
  cancelOrder
);

router.post("/return", requireRole("user"), returnValidation, requestReturn);

// Shop owner routes
router.get(
  "/shop-orders",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  requireRole("shop_owner"),
  getAllOrders
);

router.put(
  "/:id/status",
  [
    param("id").isInt(),
    body("status").isIn([
      "pending",
      "approved",
      "delivering",
      "delivered",
      "cancelled",
    ]),
  ],
  requireRole("super_admin", "admin", "shop_owner"),
  updateOrderStatus
);

// Admin routes
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("user_id").optional().isInt(),
    query("shop_id").optional().isInt(),
    query("status").optional().isString(),
    query("start_date").optional().isDate(),
    query("end_date").optional().isDate(),
  ],
  requirePermission("admin"),
  getAllOrders
);

router.get(
  "/:id",
  [param("id").isInt()],
  requireRole("user", "shop_owner", "super_admin", "admin"),
  getOrderById
);

export default router;
