// src/routes/auth.routes.js
import express from "express";
import { body } from "express-validator";
import {
  register,
  login,
  logout,
  forgotPassword,
  verifyOTP,
  resetPassword,
  resendOTP,
  getCurrentUser,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Validation rules
const registerValidation = [
  body("full_name").notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("Password must contain at least one letter and one number"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Valid phone number required"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
];

const verifyOTPValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("otp_code")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .matches(/^\d+$/)
    .withMessage("OTP must contain only numbers"),
];

const resetPasswordValidation = [
  body("verification_token")
    .notEmpty()
    .withMessage("Verification token is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("Password must contain at least one letter and one number"),
];

const resendOTPValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
];

// Routes
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);

// Logout route (token-based)
router.post("/logout", authMiddleware, logout);

router.post("/forgot-password", forgotPasswordValidation, forgotPassword);
router.post("/verify-otp", verifyOTPValidation, verifyOTP);
router.post("/reset-password", resetPasswordValidation, resetPassword);
router.post("/resend-otp", resendOTPValidation, resendOTP);

router.get("/me", authMiddleware, getCurrentUser);

export default router;
