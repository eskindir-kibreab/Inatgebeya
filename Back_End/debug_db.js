import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config();

async function debug() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
        });

        const tables = ['Users', 'Shops', 'Products', 'ProductCategories'];

        for (const table of tables) {
            try {
                const [columns] = await connection.query(`SHOW COLUMNS FROM ${table}`);
                console.log(`\n--- ${table} Columns ---`);
                console.table(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key })));
            } catch (e) {
                console.error(`❌ Table ${table} Error:`, e.message);
            }
        }

        await connection.end();
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

debug();
