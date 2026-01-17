import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { existsSync } from "fs";

config();

// Routes
import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import shopRoutes from "./src/routes/shop.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import categoryRoutes from "./src/routes/category.routes.js";
import areaRoutes from "./src/routes/area.routes.js";
import orderRoutes from "./src/routes/order.routes.js";
import deliveryRoutes from "./src/routes/delivery.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import walletRoutes from "./src/routes/wallet.routes.js";
import bankTransferRoutes from "./src/routes/bankTransfer.routes.js";
import transactionRoutes from "./src/routes/transaction.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";

import http from "http";
import { initSocket } from "./src/config/socket.js";

const app = express();
const server = http.createServer(app);

/* ===============================
   Security & Core Middleware
================================ */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://192.168.137.1:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
// app.use("/api", limiter);

app.use(compression());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===============================
   Static Uploads
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsPath = join(__dirname, "uploads");

if (!existsSync(uploadsPath)) {
  console.warn("⚠️ Uploads directory not found:", uploadsPath);
}

app.use("/uploads", express.static(uploadsPath));

/* ===============================
   Routes
================================ */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/bank-transfer", bankTransferRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/chat", chatRoutes);

/* ===============================
   Health Check
================================ */
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "InatGebeya API is running",
  });
});

/* ===============================
   404 Handler
================================ */
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ===============================
   Global Error Handler
================================ */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

/* ===============================
   Server Start
================================ */
const PORT = process.env.PORT || 5000;
const SERVER_IP = process.env.SERVER_IP || "localhost";

initSocket(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log("====================================");
  console.log(`🚀 Server running with Socket.io`);
  console.log(`🌐 API: http://${SERVER_IP}:${PORT}`);
  console.log(`🖥 Frontend Allowed: ${process.env.FRONTEND_URL}`);
  console.log(`📁 Uploads: ${uploadsPath}`);
  console.log(`❤️ Health: http://${SERVER_IP}:${PORT}/api/health`);
  console.log("====================================");
});

export default app;
