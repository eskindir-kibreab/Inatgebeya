import pool from "../config/db.js";

export class AreaService {
  // Get all areas
  static async getAllAreas() {
    const [areas] = await pool.query("SELECT * FROM Areas ORDER BY area_name");
    return areas;
  }

  // Get area by ID
  static async getAreaById(areaId) {
    const [areas] = await pool.query("SELECT * FROM Areas WHERE area_id = ?", [
      areaId,
    ]);
    return areas.length > 0 ? areas[0] : null;
  }

  // Create area
  static async createArea(areaData) {
    const { area_name } = areaData;

    const [result] = await pool.query(
      "INSERT INTO Areas (area_name) VALUES (?)",
      [area_name]
    );

    return result.insertId;
  }

  // Update area
  static async updateArea(areaId, updates) {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      return 0;
    }

    values.push(areaId);

    const [result] = await pool.query(
      `UPDATE Areas SET ${fields.join(", ")} WHERE area_id = ?`,
      values
    );

    return result.affectedRows;
  }

  // Delete area
  static async deleteArea(areaId) {
    // Check if area has shops
    const [shops] = await pool.query(
      "SELECT COUNT(*) as shop_count FROM Shops WHERE area_id = ?",
      [areaId]
    );

    if (shops[0].shop_count > 0) {
      throw new Error("Cannot delete area with existing shops");
    }

    const [result] = await pool.query("DELETE FROM Areas WHERE area_id = ?", [
      areaId,
    ]);

    return result.affectedRows;
  }

  // Check if area name exists
  static async areaNameExists(areaName, excludeAreaId = null) {
    let query = "SELECT area_id FROM Areas WHERE area_name = ?";
    const params = [areaName];

    if (excludeAreaId) {
      query += " AND area_id != ?";
      params.push(excludeAreaId);
    }

    const [areas] = await pool.query(query, params);
    return areas.length > 0;
  }

  // Get area with shop count
  static async getAreaWithStats(areaId) {
    const [areas] = await pool.query(
      `SELECT a.*, COUNT(s.shop_id) as shop_count
       FROM Areas a
       LEFT JOIN Shops s ON a.area_id = s.area_id
       WHERE a.area_id = ?
       GROUP BY a.area_id`,
      [areaId]
    );

    if (areas.length === 0) {
      return null;
    }

    return areas[0];
  }

  // Get all areas with shop counts
  static async getAllAreasWithStats() {
    const [areas] = await pool.query(
      `SELECT a.*, COUNT(s.shop_id) as shop_count
       FROM Areas a
       LEFT JOIN Shops s ON a.area_id = s.area_id
       GROUP BY a.area_id
       ORDER BY a.area_name`
    );

    return areas;
  }
}
