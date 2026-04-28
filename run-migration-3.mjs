import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const sql = readFileSync('./drizzle/0003_shallow_sheva_callister.sql', 'utf8');
const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

const conn = await mysql.createConnection(process.env.DATABASE_URL);
for (const stmt of statements) {
  console.log('Executing:', stmt.substring(0, 60) + '...');
  await conn.execute(stmt);
  console.log('OK');
}
await conn.end();
console.log('Migration 3 complete!');
