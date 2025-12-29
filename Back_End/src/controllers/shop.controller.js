import { validationResult } from "express-validator";
import { ShopService } from "../services/shop.service.js";
import { UserService } from "../services/user.service.js";

// Get all shops
export const getAllShops = async (req, res) => {
  try {
    const { page = 1, limit = 20, area_id, search, owner_id } = req.query;

    const result = await ShopService.getAllShops(
      { area_id, search, owner_id },
      page,
      limit
    );

    res.json({
      success: true,
      data: result.shops,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get shops error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shops",
    });
  }
};

// Get shop by ID
export const getShopById = async (req, res) => {
  try {
    const { id } = req.params;
    const shop = await ShopService.getShopById(id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    res.json({
      success: true,
      data: shop,
    });
  } catch (error) {
    console.error("Get shop error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shop",
    });
  }
};

// Create shop
export const createShop = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { shop_name, owner_id, area_id } = req.body;

  try {
    // Check if shop name already exists
    const shopNameExists = await ShopService.shopNameExists(shop_name);
    if (shopNameExists) {
      return res.status(400).json({
        success: false,
        message: "Shop name already exists",
      });
    }

    const shopId = await ShopService.createShop({
      shop_name,
      owner_id,
      area_id,
    });

    // Automatically promote owner to shop_owner role (ID: 4)
    await UserService.changeUserRole(owner_id, 4);

    res.status(201).json({
      success: true,
      message: "Shop created successfully and owner promoted",
      data: { shopId },
    });
  } catch (error) {
    console.error("Create shop error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create shop",
    });
  }
};

// Update shop
export const updateShop = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const updates = req.body;

  try {
    // If shop name is being updated, check if it already exists
    if (updates.shop_name) {
      const shopNameExists = await ShopService.shopNameExists(
        updates.shop_name,
        id
      );
      if (shopNameExists) {
        return res.status(400).json({
          success: false,
          message: "Shop name already exists",
        });
      }
    }

    const affectedRows = await ShopService.updateShop(id, updates);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Shop not found or no changes made",
      });
    }

    // If owner_id was updated, promote the new owner to shop_owner role (ID: 4)
    if (updates.owner_id) {
      await UserService.changeUserRole(updates.owner_id, 4);
    }

    res.json({
      success: true,
      message: "Shop updated successfully",
    });
  } catch (error) {
    console.error("Update shop error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update shop",
    });
  }
};

// Delete shop
export const deleteShop = async (req, res) => {
  try {
    const { id } = req.params;

    const affectedRows = await ShopService.deleteShop(id);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    res.json({
      success: true,
      message: "Shop deleted successfully",
    });
  } catch (error) {
    console.error("Delete shop error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete shop",
    });
  }
};

// Get my shop (for shop owner)
export const getMyShop = async (req, res) => {
  try {
    const ownerId = req.user.user_id;
    const shop = await ShopService.getShopByOwnerId(ownerId);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "You don't have a shop assigned",
      });
    }

    res.json({
      success: true,
      data: shop,
    });
  } catch (error) {
    console.error("Get my shop error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your shop",
    });
  }
};

// Get shop products
export const getShopProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await ShopService.getShopProducts(id, page, limit);

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get shop products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shop products",
    });
  }
};

// Get shop analytics
export const getShopAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has permission to view this shop's analytics
    if (req.user.role_name === "shop_owner") {
      const shop = await ShopService.getShopByOwnerId(req.user.user_id);
      if (!shop || shop.shop_id !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: "You can only view analytics for your own shop",
        });
      }
    }

    const analytics = await ShopService.getShopAnalytics(id);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Get shop analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shop analytics",
    });
  }
};
