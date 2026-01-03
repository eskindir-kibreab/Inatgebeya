import express from "express";
import { body, param, query } from "express-validator";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  updateProfile,
  changePassword,
  getCurrentUser,
} from "../controllers/user.controller.js";
import {
  authMiddleware,
  requirePermission,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Validation rules
const createUserValidation = [
  body("full_name").notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone").optional().isMobilePhone(),
  body("role_name").isIn([
    "admin",
    "item_adder_admin",
    "shop_owner",
    "delivery_admin",
    "delivery_person",
    "user",
  ]),
];

const updateProfileValidation = [
  body("full_name").optional().notEmpty(),
  body("email").optional().isEmail(),
  body("phone").optional().isMobilePhone(),
];

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
  body("confirmPassword")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match new password");
      }
      return true;
    }),
];

// All routes require authentication
router.use(authMiddleware);

// Get my profile
router.get("/profile", getCurrentUser);

// Update my profile
router.put("/profile", updateProfileValidation, updateProfile);

// Change my password
router.put("/profile/password", changePasswordValidation, changePassword);

// Admin routes - Get all users
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("role").optional().isString(),
    query("search").optional().isString(),
    query("is_active").optional().isBoolean(),
  ],
  requirePermission("admin"),
  getAllUsers
);

// Admin routes - Get user by ID
router.get(
  "/:id",
  [param("id").isInt()],
  requirePermission("admin"),
  getUserById
);

// Admin routes - Create user
router.post("/", requirePermission("admin"), createUserValidation, createUser);

// Admin routes - Update user
router.put(
  "/:id",
  [
    param("id").isInt(),
    body("full_name").optional().notEmpty(),
    body("email").optional().isEmail(),
    body("phone").optional().isMobilePhone(),
    body("password").optional().isLength({ min: 6 }),
    body("is_active").optional().isBoolean(),
  ],
  requirePermission("admin"),
  updateUser
);

// Admin routes - Delete user
router.delete(
  "/:id",
  [param("id").isInt()],
  requirePermission("admin"),
  deleteUser
);

// Admin routes - Change user role
router.put(
  "/:id/role",
  [
    param("id").isInt(),
    body("role_name").isIn([
      "admin",
      "item_adder_admin",
      "shop_owner",
      "delivery_admin",
      "delivery_person",
      "user",
    ]),
  ],
  requirePermission("admin"),
  changeUserRole
);

export default router;
