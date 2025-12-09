// src/controllers/auth.controller.js
import { validationResult } from "express-validator";
import {
  registerUserService,
  loginUserService,
  logoutUserService,
  forgotPasswordService,
  verifyOTPService,
  resetPasswordService,
  resendOTPService,
  getCurrentUserService,
} from "../services/auth.service.js";

// ------------------ REGISTER ------------------
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    // pass req to service to gather user-agent / ip if needed
    const result = await registerUserService(req.body, {
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip || req.connection?.remoteAddress,
    });

    if (result.error)
      return res.status(400).json({ success: false, message: result.error });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

// ------------------ LOGIN ------------------
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    // pass req info for token storage
    const result = await loginUserService(req.body, {
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip || req.connection?.remoteAddress,
    });

    if (result.error)
      return res.status(401).json({ success: false, message: result.error });

    const { user, coins, token } = result;
    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      message: "Login successful",
      data: { user: { ...safeUser, coins }, token },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

// ------------------ LOGOUT ------------------
export const logout = async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token)
      return res.status(400).json({ success: false, message: "Token missing" });

    await logoutUserService(token);

    res.json({ success: true, message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};

// ------------------ FORGOT PASSWORD ------------------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await forgotPasswordService(email);

    // don't reveal whether email exists — service already handles that
    res.json({
      success: true,
      message: "If your email exists, you will receive an OTP",
      ...(process.env.NODE_ENV === "development" && { otp: result?.otpCode }),
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to process reset request" });
  }
};

// ------------------ VERIFY OTP ------------------
export const verifyOTP = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const result = await verifyOTPService(req.body);

    if (result.error)
      return res.status(400).json({ success: false, message: result.error });

    res.json({
      success: true,
      message: "OTP verified successfully",
      verification_token: result.verificationToken,
      expires_in: "10 minutes",
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
  console.log("BODY:", req.body);
};

// ------------------ RESET PASSWORD ------------------
export const resetPassword = async (req, res) => {
  try {
    const result = await resetPasswordService(req.body);

    if (result.error)
      return res.status(400).json({ success: false, message: result.error });

    res.json({
      success: true,
      message: "Password reset successful. You can now login.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to reset password" });
  }
};

// ------------------ RESEND OTP ------------------
export const resendOTP = async (req, res) => {
  try {
    const result = await resendOTPService(req.body.email);

    if (result.error)
      return res.status(400).json({ success: false, message: result.error });

    res.json({
      success: true,
      message: "New OTP sent",
      ...(process.env.NODE_ENV === "development" && { otp: result.otpCode }),
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ success: false, message: "Failed to resend OTP" });
  }
};

// ------------------ GET CURRENT USER ------------------
export const getCurrentUser = async (req, res) => {
  try {
    const result = await getCurrentUserService(req.user);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Get current user error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to get user profile" });
  }
};
