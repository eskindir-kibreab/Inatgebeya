import express from "express";
import { body, param, query } from "express-validator";
import {
  getAllAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
} from "../controllers/area.controller.js";
import {
  authMiddleware,
  requirePermission,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Validation rules
const areaValidation = [
  body("area_name").notEmpty().withMessage("Area name is required"),
];

// Public routes
router.get("/", [query("stats").optional().isBoolean()], getAllAreas);

router.get("/:id", [param("id").isInt()], getAreaById);

// Protected routes (Admin, Super Admin)
router.use(authMiddleware);

router.post("/", requirePermission("admin"), areaValidation, createArea);

router.put(
  "/:id",
  [param("id").isInt(), ...areaValidation],
  requirePermission("admin"),
  updateArea
);

router.delete(
  "/:id",
  [param("id").isInt()],
  requirePermission("admin"),
  deleteArea
);

export default router;
