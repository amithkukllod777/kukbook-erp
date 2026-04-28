import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = readFileSync('./drizzle/0001_mean_wallflower.sql', 'utf8');
const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

const conn = await mysql.createConnection(DATABASE_URL);

for (const stmt of statements) {
  try {
    await conn.execute(stmt);
    const tableName = stmt.match(/CREATE TABLE.*?`(\w+)`/)?.[1] || 'unknown';
    console.log(`✓ Created table: ${tableName}`);
  } catch (err) {
    if (err.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log(`⊘ Table already exists, skipping`);
    } else {
      console.error(`✗ Error:`, err.message);
    }
  }
}

await conn.end();
console.log('Migration complete!');
