import express from "express";
import { body, param, query } from "express-validator";
import {
  getAllDeliveryPersons,
  getDeliveryPersonById,
  createDeliveryPerson,
  updateDeliveryPerson,
  toggleDeliveryPersonStatus,
  getPendingDeliveries,
  getAssignedDeliveries,
  assignDelivery,
  updateDeliveryStatus,
  getDeliveryHistory,
  getDeliveryStats,
} from "../controllers/delivery.controller.js";
import {
  authMiddleware,
  requireRole,
  requirePermission,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Validation rules
const deliveryPersonValidation = [
  body("user_id").isInt().withMessage("Valid user ID is required"),
  body("area_id").isInt().withMessage("Valid area ID is required"),
];

const assignDeliveryValidation = [
  body("order_id").isInt().withMessage("Valid order ID is required"),
  body("delivery_person_id")
    .isInt()
    .withMessage("Valid delivery person ID is required"),
];

// Protected routes
router.use(authMiddleware);

// Delivery person routes
router.get(
  "/assigned",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  requireRole("delivery_person"),
  getAssignedDeliveries
);

router.put(
  "/:id/status",
  [
    param("id").isInt(),
    body("status").isIn(["assigned", "picked", "delivered", "returned"]),
  ],
  requireRole("delivery_person", "delivery_admin", "super_admin", "admin"),
  updateDeliveryStatus
);

router.get(
  "/history",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("delivery_person_id").optional().isInt(),
  ],
  requireRole("delivery_person", "delivery_admin", "super_admin", "admin"),
  getDeliveryHistory
);

// Delivery admin routes
router.get(
  "/delivery-persons",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("area_id").optional().isInt(),
    query("status").optional().isIn(["active", "inactive"]),
    query("search").optional().isString().trim(),
  ],
  requirePermission("delivery_admin"),
  getAllDeliveryPersons
);

router.get(
  "/delivery-persons/:id",
  [param("id").isInt()],
  requirePermission("delivery_admin"),
  getDeliveryPersonById
);

router.post(
  "/delivery-persons",
  requirePermission("delivery_admin"),
  deliveryPersonValidation,
  createDeliveryPerson
);

router.put(
  "/delivery-persons/:id",
  [param("id").isInt(), body("area_id").optional().isInt()],
  requirePermission("delivery_admin"),
  updateDeliveryPerson
);

router.put(
  "/delivery-persons/:id/status",
  [param("id").isInt(), body("status").isIn(["active", "inactive"])],
  requirePermission("delivery_admin"),
  toggleDeliveryPersonStatus
);

router.get(
  "/pending",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("area_id").optional().isInt(),
  ],
  requirePermission("delivery_admin"),
  getPendingDeliveries
);

router.post(
  "/assign",
  requirePermission("delivery_admin"),
  assignDeliveryValidation,
  assignDelivery
);

// Statistics
router.get(
  "/stats",
  [
    query("delivery_person_id").optional().isInt(),
    query("area_id").optional().isInt(),
    query("start_date").optional().isDate(),
    query("end_date").optional().isDate(),
  ],
  requirePermission("delivery_admin"),
  getDeliveryStats
);

export default router;
