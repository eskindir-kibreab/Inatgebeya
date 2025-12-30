import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    await pool.query(`
    CREATE TABLE IF NOT EXISTS pendingregistrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash TEXT NOT NULL,
      phone VARCHAR(20),
      otp_code VARCHAR(6) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

    console.log('Table pendingregistrations created successfully');
    await pool.end();
}

run().catch(console.error);
