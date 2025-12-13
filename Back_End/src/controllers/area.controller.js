import { validationResult } from "express-validator";
import { AreaService } from "../services/area.service.js";

// Get all areas
export const getAllAreas = async (req, res) => {
  try {
    const withStats = req.query.stats === "true";

    let areas;
    if (withStats) {
      areas = await AreaService.getAllAreasWithStats();
    } else {
      areas = await AreaService.getAllAreas();
    }

    res.json({
      success: true,
      data: areas,
    });
  } catch (error) {
    console.error("Get areas error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch areas",
    });
  }
};

// Get area by ID
export const getAreaById = async (req, res) => {
  try {
    const { id } = req.params;
    const area = await AreaService.getAreaById(id);

    if (!area) {
      return res.status(404).json({
        success: false,
        message: "Area not found",
      });
    }

    res.json({
      success: true,
      data: area,
    });
  } catch (error) {
    console.error("Get area error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch area",
    });
  }
};

// Create area
export const createArea = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { area_name } = req.body;

  try {
    // Check if area name already exists
    const areaExists = await AreaService.areaNameExists(area_name);
    if (areaExists) {
      return res.status(400).json({
        success: false,
        message: "Area name already exists",
      });
    }

    const areaId = await AreaService.createArea({ area_name });

    res.status(201).json({
      success: true,
      message: "Area created successfully",
      data: { areaId },
    });
  } catch (error) {
    console.error("Create area error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create area",
    });
  }
};

// Update area
export const updateArea = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const { area_name } = req.body;

  try {
    // Check if area name already exists
    const areaExists = await AreaService.areaNameExists(area_name, id);
    if (areaExists) {
      return res.status(400).json({
        success: false,
        message: "Area name already exists",
      });
    }

    const affectedRows = await AreaService.updateArea(id, { area_name });

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Area not found or no changes made",
      });
    }

    res.json({
      success: true,
      message: "Area updated successfully",
    });
  } catch (error) {
    console.error("Update area error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update area",
    });
  }
};

// Delete area
export const deleteArea = async (req, res) => {
  try {
    const { id } = req.params;

    const affectedRows = await AreaService.deleteArea(id);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Area not found",
      });
    }

    res.json({
      success: true,
      message: "Area deleted successfully",
    });
  } catch (error) {
    console.error("Delete area error:", error);

    if (error.message === "Cannot delete area with existing shops") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete area",
    });
  }
};
