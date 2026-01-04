import pool from "../config/db.js";
import bcrypt from "bcryptjs";

async function seedData() {
    console.log("🌱 Seeding test data...");

    try {
        // 1. Create User
        const passwordHash = await bcrypt.hash("password123", 10);
        const [userResult] = await pool.query(
            "INSERT IGNORE INTO Users (full_name, email, password_hash, phone, role_id) VALUES (?, ?, ?, ?, ?)",
            ["Test Customer", "customer@test.com", passwordHash, "0911223344", 2]
        );
        const customerId = userResult.insertId || 1;

        const [ownerResult] = await pool.query(
            "INSERT IGNORE INTO Users (full_name, email, password_hash, phone, role_id) VALUES (?, ?, ?, ?, ?)",
            ["Test Seller", "seller@test.com", passwordHash, "0922334455", 3]
        );
        const ownerId = ownerResult.insertId || (ownerResult.affectedRows === 0 ? 2 : ownerResult.insertId);

        // 2. Create Area
        await pool.query("INSERT IGNORE INTO Areas (area_name) VALUES (?)", ["Bole"]);
        const [area] = await pool.query("SELECT area_id FROM Areas LIMIT 1");

        // 3. Create Shop
        const [shopResult] = await pool.query(
            "INSERT IGNORE INTO Shops (shop_name, owner_id, area_id) VALUES (?, ?, ?)",
            ["Test Shop", ownerId, area[0].area_id]
        );
        const shopId = shopResult.insertId || 1;

        // 3.5 Ensure Wallet exists
        await pool.query("INSERT IGNORE INTO SellerWallets (shop_id) VALUES (?)", [shopId]);

        // 4. Create Category
        await pool.query("INSERT IGNORE INTO ProductCategories (category_name) VALUES (?)", ["Electronics"]);
        const [category] = await pool.query("SELECT category_id FROM ProductCategories LIMIT 1");

        // 5. Create Product
        await pool.query(
            "INSERT IGNORE INTO Products (product_name, description, price, stock, shop_id, category_id) VALUES (?, ?, ?, ?, ?, ?)",
            ["Test Product", "Testing Chapa", 1000, 10, shopId, category[0].category_id]
        );

        console.log("✅ Seeding completed!");
    } catch (error) {
        console.error("❌ Seeding failed:", error.message);
    } finally {
        process.exit(0);
    }
}

seedData();
