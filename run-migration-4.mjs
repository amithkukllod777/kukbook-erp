import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const stmts = [
  "ALTER TABLE `inventory` ADD `hsnCode` varchar(20)",
  "ALTER TABLE `inventory` ADD `gstRate` decimal(5,2) DEFAULT '18.00'",
];
for (const sql of stmts) {
  try { await conn.execute(sql); console.log("OK:", sql.substring(0, 60)); }
  catch (e) { console.log("SKIP:", e.message?.substring(0, 80)); }
}
await conn.end();
console.log("Migration 4 done");
