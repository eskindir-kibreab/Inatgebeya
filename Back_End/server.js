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

const app = express();

/* ===============================
   Security & Core Middleware
================================ */
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
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

app.listen(PORT, "0.0.0.0", () => {
  console.log("====================================");
  console.log(`🚀 Server running`);
  console.log(`🌐 API: http://10.198.75.102:${PORT}`);
  console.log(`🖥 Frontend Allowed: ${process.env.FRONTEND_URL}`);
  console.log(`📁 Uploads: ${uploadsPath}`);
  console.log(`❤️ Health: http://10.198.75.102:${PORT}/api/health`);
  console.log("====================================");
});

export default app;
