// src/services/auth.service.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../config/db.js";
import { sendPasswordResetOTP, sendWelcomeEmail, sendRegistrationOTP } from "../utils/email.util.js";

// Helper to generate OTP
export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ------------------ REGISTER ------------------
export const registerUserService = async (
  { full_name, email, password, phone },
  meta = {}
) => {
  // Check if user exists
  const [existing] = await pool.query(
    "SELECT user_id FROM Users WHERE email = ?",
    [email]
  );
  if (existing.length > 0) {
    return { error: "User with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otpCode = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete any existing pending registrations for this email
  await pool.query("DELETE FROM pendingregistrations WHERE email = ?", [email]);

  // Store in pendingregistrations
  await pool.query(
    `INSERT INTO pendingregistrations (full_name, email, password_hash, phone, otp_code, expires_at) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [full_name, email, hashedPassword, phone || null, otpCode, expiresAt]
  );

  // Send registration OTP email
  await sendRegistrationOTP(email, otpCode);

  return {
    success: true,
    message: "OTP sent to email",
  };
};

// ------------------ VERIFY REGISTRATION OTP ------------------
export const verifyRegistrationOTPService = async ({ email, otp_code }, meta = {}) => {
  const [pending] = await pool.query(
    `SELECT * FROM pendingregistrations 
     WHERE email = ? AND otp_code = ? AND expires_at > NOW()`,
    [email, otp_code]
  );

  if (pending.length === 0) {
    return { error: "Invalid or expired OTP" };
  }

  const userData = pending[0];

  // Get user role
  const [roles] = await pool.query(
    "SELECT role_id FROM Roles WHERE role_name = ?",
    ["user"]
  );
  if (roles.length === 0) {
    return { error: "User role not found" };
  }

  // Create user
  const [result] = await pool.query(
    `INSERT INTO Users (full_name, email, password_hash, phone, role_id, is_active) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userData.full_name,
      userData.email,
      userData.password_hash,
      userData.phone,
      roles[0].role_id,
      true,
    ]
  );

  const userId = result.insertId;

  // Initialize coins
  await pool.query("INSERT INTO UserCoins (user_id, balance) VALUES (?, 0)", [
    userId,
  ]);

  // Generate token
  const token = jwt.sign(
    { userId, email: userData.email, role: "user" },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  // Store token in usertokens table
  try {
    const expiresAt = process.env.JWT_EXPIRES_IN
      ? new Date(Date.now() + parseJWTExpiresMs(process.env.JWT_EXPIRES_IN))
      : null;

    await pool.query(
      `INSERT INTO usertokens (user_id, token, expires_at, user_agent, ip_address) VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        token,
        expiresAt,
        meta.userAgent || null,
        meta.ipAddress || null,
      ]
    );
  } catch (err) {
    console.error("Failed to store token after verification:", err);
  }

  // Send welcome email
  await sendWelcomeEmail(userData.email, userData.full_name);

  // Delete pending registration
  await pool.query("DELETE FROM pendingregistrations WHERE id = ?", [
    userData.id,
  ]);

  return {
    userId,
    full_name: userData.full_name,
    email: userData.email,
    phone: userData.phone,
    role: "user",
    token,
  };
};

// Helper to compute milliseconds from a JWT expires string like '1d', '24h', '3600s'
const parseJWTExpiresMs = (expiresStr) => {
  // Common formats: "1d", "24h", "3600s", "15m", "3600" (seconds)
  if (!expiresStr) return 0;
  const s = expiresStr.toString().trim();
  const last = s[s.length - 1];
  const num = parseInt(s.slice(0, s.length - 1), 10);
  if (last === "d") return num * 24 * 60 * 60 * 1000;
  if (last === "h") return num * 60 * 60 * 1000;
  if (last === "m") return num * 60 * 1000;
  if (last === "s") return num * 1000;
  // fallback: treat as seconds if purely numeric
  if (!isNaN(parseInt(s, 10))) return parseInt(s, 10) * 1000;
  return 0;
};

// ------------------ LOGIN ------------------
export const loginUserService = async ({ email, password }, meta = {}) => {
  const [users] = await pool.query(
    `SELECT u.*, r.role_name 
     FROM Users u 
     JOIN Roles r ON u.role_id = r.role_id 
     WHERE u.email = ? AND u.is_active = TRUE`,
    [email]
  );

  if (users.length === 0) return { error: "Invalid email or password" };

  const user = users[0];

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return { error: "Invalid email or password" };

  const token = jwt.sign(
    { userId: user.user_id, email: user.email, role: user.role_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  // store token in DB
  try {
    const expiresAt = process.env.JWT_EXPIRES_IN
      ? new Date(Date.now() + parseJWTExpiresMs(process.env.JWT_EXPIRES_IN))
      : null;

    await pool.query(
      `INSERT INTO usertokens (user_id, token, expires_at, user_agent, ip_address) VALUES (?, ?, ?, ?, ?)`,
      [
        user.user_id,
        token,
        expiresAt,
        meta.userAgent || null,
        meta.ipAddress || null,
      ]
    );
  } catch (err) {
    console.error("Failed to store login token:", err);
  }

  const [coins] = await pool.query(
    "SELECT balance FROM UserCoins WHERE user_id = ?",
    [user.user_id]
  );

  return { user, coins: coins.length ? coins[0].balance : 0, token };
};

// ------------------ LOGOUT ------------------
export const logoutUserService = async (token) => {
  if (!token) return;
  await pool.query("DELETE FROM usertokens WHERE token = ?", [token]);
};

// ------------------ FORGOT PASSWORD ------------------
// ------------------ FORGOT PASSWORD ------------------
export const forgotPasswordService = async (email) => {
  const [users] = await pool.query(
    "SELECT user_id, full_name FROM Users WHERE email = ? AND is_active = TRUE",
    [email]
  );

  if (users.length === 0) {
    // keep silent about existence
    return { ok: true };
  }

  const user = users[0];
  const otpCode = generateOTP();

  // Delete existing resets for this user
  await pool.query("DELETE FROM passwordresets WHERE user_id = ?", [
    user.user_id,
  ]);

  // Insert new OTP record — let MySQL compute expiry to avoid timezone issues
  await pool.query(
    `INSERT INTO passwordresets (user_id, otp_code, expires_at, is_used, attempts, created_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), FALSE, 0, NOW())`,
    [user.user_id, otpCode]
  );

  // Send OTP email — pass only the email (you asked for this)
  await sendPasswordResetOTP(email, otpCode);

  // Return otp in development for testing only
  return { otpCode };
};

// ------------------ VERIFY OTP ------------------
export const verifyOTPService = async ({ email, otp_code }) => {
  console.log("email", email, "otp_code", otp_code);
  const [users] = await pool.query(
    "SELECT user_id FROM Users WHERE email = ? AND is_active = TRUE",
    [email]
  );
  if (users.length === 0) return { error: "Invalid email or OTP" };

  const user = users[0];

  // Find an OTP row that is not used, not expired, attempts < 3, most recent first
  const [otps] = await pool.query(
    `SELECT * FROM passwordresets 
     WHERE user_id = ? 
       AND otp_code = ?
       AND expires_at >= NOW()
       AND is_used = FALSE
       AND attempts < 3
     ORDER BY created_at DESC
     LIMIT 1`,
    [user.user_id, otp_code]
  );

  if (otps.length === 0) {
    // increment attempts for matching rows (if any) to deter brute force
    await pool.query(
      `UPDATE passwordresets 
       SET attempts = attempts + 1 
       WHERE user_id = ? AND otp_code = ?`,
      [user.user_id, otp_code]
    );

    // helpful debug (will not expose OTP) — remove or lower in production
    console.debug(
      `verifyOTP: no valid OTP found for user_id=${user.user_id}, otp=${otp_code}`
    );

    return { error: "Invalid or expired OTP" };
  }

  const otp = otps[0];

  // Create verification token (short lived)
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const tokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await pool.query(
    `UPDATE passwordresets 
     SET is_used = TRUE,
         verification_token = ?,
         token_expires_at = ?
     WHERE reset_id = ?`,
    [verificationToken, tokenExpiresAt, otp.reset_id]
  );

  return { verificationToken };
};

// ------------------ RESET PASSWORD ------------------
// 3-step flow: verifyOT P -> get verification_token -> resetPassword with verification_token
export const resetPasswordService = async ({
  verification_token,
  newPassword,
}) => {
  const [verifications] = await pool.query(
    `SELECT pr.*, u.email 
     FROM passwordresets pr
     JOIN Users u ON pr.user_id = u.user_id
     WHERE pr.verification_token = ? 
     AND pr.token_expires_at > NOW()
     AND u.is_active = TRUE`,
    [verification_token]
  );

  if (verifications.length === 0) {
    return { error: "Invalid or expired verification token" };
  }

  const verification = verifications[0];

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await pool.query("UPDATE Users SET password_hash = ? WHERE user_id = ?", [
    hashedPassword,
    verification.user_id,
  ]);

  // remove used reset rows
  await pool.query("DELETE FROM passwordresets WHERE reset_id = ?", [
    verification.reset_id,
  ]);

  // 5. Get full user data for auto-login
  const [users] = await pool.query(
    `SELECT u.*, r.role_name 
     FROM Users u 
     JOIN Roles r ON u.role_id = r.role_id 
     WHERE u.user_id = ?`,
    [verification.user_id]
  );

  const user = users[0];

  // 6. Generate token
  const token = jwt.sign(
    { userId: user.user_id, email: user.email, role: user.role_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  // 7. Store token in DB
  try {
    const expiresAt = process.env.JWT_EXPIRES_IN
      ? new Date(Date.now() + parseJWTExpiresMs(process.env.JWT_EXPIRES_IN))
      : null;

    await pool.query(
      `INSERT INTO usertokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
      [user.user_id, token, expiresAt]
    );
  } catch (err) {
    console.error("Failed to store token after reset:", err);
  }

  const { password_hash, ...safeUser } = user;
  return { success: true, user: safeUser, token };
};

// ------------------ RESEND OTP ------------------
export const resendOTPService = async (email) => {
  // 1. Check if it's a pending registration
  const [pending] = await pool.query(
    "SELECT * FROM pendingregistrations WHERE email = ?",
    [email]
  );

  if (pending.length > 0) {
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await pool.query(
      "UPDATE pendingregistrations SET otp_code = ?, expires_at = ? WHERE email = ?",
      [otpCode, expiresAt, email]
    );

    await sendRegistrationOTP(email, otpCode);
    return { otpCode };
  }

  // 2. Check if it's an existing user (forgot password)
  const [users] = await pool.query(
    "SELECT user_id FROM Users WHERE email = ? AND is_active = TRUE",
    [email]
  );

  if (users.length === 0) return { error: "User not found" };

  const user = users[0];

  const [recent] = await pool.query(
    `SELECT * FROM passwordresets
     WHERE user_id = ?
     AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)`,
    [user.user_id]
  );

  if (recent.length > 0)
    return { error: "Please wait 1 minute before requesting another OTP" };

  const otpCode = generateOTP();

  // Delete old rows, then insert a new one using DB time
  await pool.query("DELETE FROM passwordresets WHERE user_id = ?", [
    user.user_id,
  ]);

  await pool.query(
    `INSERT INTO passwordresets (user_id, otp_code, expires_at, is_used, attempts, created_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), FALSE, 0, NOW())`,
    [user.user_id, otpCode]
  );

  await sendPasswordResetOTP(email, otpCode);

  return { otpCode };
};

// ------------------ CURRENT USER ------------------
export const getCurrentUserService = async (user) => {
  const [coins] = await pool.query(
    "SELECT balance FROM UserCoins WHERE user_id = ?",
    [user.user_id]
  );

  return {
    ...user,
    coins: coins.length ? coins[0].balance : 0,
  };
};
