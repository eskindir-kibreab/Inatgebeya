import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload single file
export const uploadSingleFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
      },
    });
  } catch (error) {
    console.error("Upload file error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload file",
    });
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const files = req.files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`,
    }));

    res.json({
      success: true,
      message: "Files uploaded successfully",
      data: files,
    });
  } catch (error) {
    console.error("Upload files error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload files",
    });
  }
};

// Delete file
export const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "..", "uploads", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Check if file is being used (optional - you can add database checks here)
    // For now, just delete the file

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete file",
    });
  }
};

// List uploaded files
export const listFiles = async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, "..", "uploads");

    if (!fs.existsSync(uploadsDir)) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const files = fs.readdirSync(uploadsDir).map((filename) => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);

      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url: `/uploads/${filename}`,
      };
    });

    res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error("List files error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list files",
    });
  }
};
