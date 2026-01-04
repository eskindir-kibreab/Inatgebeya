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
  getDeliveryProfile,
  deleteDeliveryPerson,
} from "../controllers/delivery.controller.js";
import {
  authMiddleware,
  requireRole,
  requirePermission,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Validation rules
const deliveryPersonValidation = [
  body("user_id")
    .optional()
    .isInt()
    .withMessage("Valid user ID is required if provided"),
  body("area_id").isInt().withMessage("Valid area ID is required"),
  body("name")
    .if(body("user_id").not().exists())
    .notEmpty()
    .withMessage("Name is required for new delivery person"),
  body("email")
    .if(body("user_id").not().exists())
    .isEmail()
    .withMessage("Valid email is required for new delivery person"),
  body("password")
    .if(body("user_id").not().exists())
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
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
router.get("/profile", getDeliveryProfile);

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
  requirePermission("super_admin", "admin", "delivery_admin", "shop_owner"),
  getAllDeliveryPersons
);

router.get(
  "/delivery-persons/:id",
  [param("id").isInt()],
  requirePermission("super_admin", "admin", "delivery_admin", "shop_owner"),
  getDeliveryPersonById
);

router.post(
  "/delivery-persons",
  requirePermission("super_admin", "admin", "delivery_admin"),
  deliveryPersonValidation,
  createDeliveryPerson
);

router.put(
  "/delivery-persons/:id",
  [param("id").isInt(), body("area_id").optional().isInt()],
  requirePermission("super_admin", "admin", "delivery_admin"),
  updateDeliveryPerson
);

router.put(
  "/delivery-persons/:id/status",
  [param("id").isInt(), body("status").isIn(["active", "inactive"])],
  requirePermission("super_admin", "admin", "delivery_admin"),
  toggleDeliveryPersonStatus
);

router.delete(
  "/delivery-persons/:id",
  [param("id").isInt()],
  requirePermission("super_admin", "admin", "delivery_admin"),
  deleteDeliveryPerson
);

router.get(
  "/pending",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("area_id").optional().isInt(),
  ],
  requireRole("super_admin", "admin", "delivery_admin", "delivery_person", "shop_owner"),
  getPendingDeliveries
);

router.post(
  "/assign",
  requireRole("super_admin", "admin", "delivery_admin", "delivery_person", "shop_owner"),
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
  requirePermission("super_admin", "admin", "delivery_admin"),
  getDeliveryStats
);

export default router;
