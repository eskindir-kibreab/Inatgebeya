// src/utils/email.util.js
import nodemailer from "nodemailer";
import { config } from "dotenv";

config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email configuration error:", error);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

export const sendEmail = async (to, subject, html) => {
  if (!to || typeof to !== "string") {
    console.error("❌ Email sending failed: EMPTY OR INVALID RECIPIENT");
    return { success: false, error: "Invalid email address" };
  }

  try {
    const mailOptions = {
      from: `"InatGebeya" <${process.env.EMAIL_FROM}>`,
      to: to.trim(),
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent to:", to);
    console.log("📧 Message ID:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return { success: false, error: error.message };
  }
};

export const sendPasswordResetOTP = async (email, otpCode) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4CAF50; margin: 0;">InatGebeya</h1>
        <p style="color: #666; margin-top: 5px;">Your E-commerce Platform</p>
      </div>
      
      <h2 style="color: #333; text-align: center;">Password Reset OTP</h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="margin-bottom: 15px; color: #555;">Use the following OTP code to reset your password:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #4CAF50; margin: 20px 0; padding: 15px; background-color: white; border: 2px dashed #4CAF50; border-radius: 8px;">
          ${otpCode}
        </div>
        <p style="color: #ff9800; font-weight: bold;">⚠️ This OTP will expire in 1 hour</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="color: #666; font-size: 14px; margin-bottom: 5px;"><strong>Security Tips:</strong></p>
        <ul style="color: #666; font-size: 12px; padding-left: 20px; margin: 0;">
          <li>Never share this OTP with anyone</li>
          <li>InatGebeya will never ask for your OTP</li>
          <li>If you didn't request this, please ignore this email</li>
        </ul>
      </div>
      
      <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} InatGebeya. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail(email, "Your Password Reset OTP - InatGebeya", html);
};

export const sendRegistrationOTP = async (email, otpCode) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4CAF50; margin: 0;">InatGebeya</h1>
        <p style="color: #666; margin-top: 5px;">Your E-commerce Platform</p>
      </div>
      
      <h2 style="color: #333; text-align: center;">Verify Your Account</h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="margin-bottom: 15px; color: #555;">Welcome to InatGebeya! Use the following OTP code to verify your account and complete registration:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #4CAF50; margin: 20px 0; padding: 15px; background-color: white; border: 2px dashed #4CAF50; border-radius: 8px;">
          ${otpCode}
        </div>
        <p style="color: #ff9800; font-weight: bold;">⚠️ This OTP will expire in 10 minutes</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="color: #666; font-size: 14px; margin-bottom: 5px;"><strong>Security Tips:</strong></p>
        <ul style="color: #666; font-size: 12px; padding-left: 20px; margin: 0;">
          <li>Never share this OTP with anyone</li>
          <li>If you didn't attempt to register, please ignore this email</li>
        </ul>
      </div>
      
      <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} InatGebeya. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail(email, "Verify Your Registration - InatGebeya", html);
};

export const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to InatGebeya!</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering with InatGebeya. Your account has been successfully created.</p>
      <p>You can now start shopping from our wide range of products.</p>
      <p>Happy shopping!</p>
      <hr>
      <p style="color: #666; font-size: 12px;">InatGebeya E-commerce Platform</p>
    </div>
  `;

  return sendEmail(email, "Welcome to InatGebeya!", html);
};
