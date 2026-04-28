import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();
const conn = await mysql.createConnection(process.env.DATABASE_URL);
await conn.execute("ALTER TABLE `invoice_lines` ADD COLUMN IF NOT EXISTS `discount` decimal(15,2) DEFAULT '0' NOT NULL");
console.log("Migration 5 done: discount column added to invoice_lines");
await conn.end();
