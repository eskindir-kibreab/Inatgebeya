
import pool from '../config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from Back_End/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const fixOrder = async () => {
    try {
        console.log("Fixing Order #42 amount...");
        // Update order total to 1000 ETB
        const [result] = await pool.query(
            "UPDATE Orders SET total = 1000 WHERE order_id = 42"
        );
        console.log("Update result:", result);
        console.log("Order #42 total updated to 1000 ETB for testing.");
        process.exit(0);
    } catch (error) {
        console.error("Error updating order:", error);
        process.exit(1);
    }
};

fixOrder();
