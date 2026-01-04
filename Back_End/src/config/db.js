import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection and Sync Schema
pool
  .getConnection()
  .then(async (connection) => {
    console.log("✅ Database connected successfully");

    try {
      // 1. Ensure UserIdentifications table exists
      await connection.query(`
        CREATE TABLE IF NOT EXISTS UserIdentifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          fan_number VARCHAR(100) NOT NULL UNIQUE,
          id_image_url VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
        )
      `);
      console.log("✅ UserIdentifications table verified");

      // 2. Ensure fan_number column exists in pendingregistrations
      const [columns] = await connection.query("SHOW COLUMNS FROM pendingregistrations LIKE 'fan_number'");
      if (columns.length === 0) {
        await connection.query("ALTER TABLE pendingregistrations ADD COLUMN fan_number VARCHAR(100) NULL");
        console.log("✅ Added fan_number column to pendingregistrations");
      }

      // 3. Marketplace Financial Tables
      await connection.query(`
        CREATE TABLE IF NOT EXISTS Payments (
          payment_id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          user_id INT NOT NULL,
          tx_ref VARCHAR(255) NOT NULL UNIQUE,
          amount DECIMAL(15,2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'ETB',
          status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
          payment_method VARCHAR(50) DEFAULT 'chapa',
          chapa_reference VARCHAR(255),
          paid_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES Orders(order_id),
          FOREIGN KEY (user_id) REFERENCES Users(user_id)
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS SellerWallets (
          wallet_id INT AUTO_INCREMENT PRIMARY KEY,
          shop_id INT NOT NULL UNIQUE,
          balance DECIMAL(15,2) DEFAULT 0.00,
          pending_balance DECIMAL(15,2) DEFAULT 0.00,
          total_earned DECIMAL(15,2) DEFAULT 0.00,
          total_withdrawn DECIMAL(15,2) DEFAULT 0.00,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (shop_id) REFERENCES Shops(shop_id) ON DELETE CASCADE
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS PlatformRevenue (
          revenue_id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          source ENUM('commission', 'gateway_fee') NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES Orders(order_id)
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS TaxRecords (
          tax_record_id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          tax_amount DECIMAL(15,2) NOT NULL,
          tax_type VARCHAR(50) DEFAULT 'VAT',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES Orders(order_id)
        )
      `);

      // Initialize wallets for existing shops
      await connection.query(`
        INSERT IGNORE INTO SellerWallets (shop_id)
        SELECT shop_id FROM Shops
      `);

      // 4. Bank Transfer Tables
      const bankTables = ['awash_bank_payments', 'cbe_bank_payments', 'birhan_bank_payments'];
      for (const table of bankTables) {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS ${table} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            user_id INT NOT NULL,
            transaction_id VARCHAR(255) NOT NULL,
            receipt_url VARCHAR(255) NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            admin_action_at TIMESTAMP NULL,
            UNIQUE KEY unique_tx (transaction_id),
            FOREIGN KEY (order_id) REFERENCES Orders(order_id),
            FOREIGN KEY (user_id) REFERENCES Users(user_id)
          )
        `);
      }
      console.log("✅ Bank transfer tables verified");

      // 5. Update Orders Table with financial fields
      const [orderCols] = await connection.query("SHOW COLUMNS FROM Orders LIKE 'tax_amount'");
      if (orderCols.length === 0) {
        await connection.query(`
          ALTER TABLE Orders 
          ADD COLUMN tax_amount DECIMAL(15,2) DEFAULT 0.00,
          ADD COLUMN commission_total DECIMAL(15,2) DEFAULT 0.00,
          ADD COLUMN gateway_fee DECIMAL(15,2) DEFAULT 0.00
        `);
        console.log("✅ Added financial columns to Orders table");
      }

      console.log("✅ Marketplace financial tables verified");
    } catch (schemaError) {
      console.error("❌ Schema synchronization failed:", schemaError.message);
    }

    connection.release();
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  });

export default pool;
