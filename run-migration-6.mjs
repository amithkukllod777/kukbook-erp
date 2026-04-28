import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const sql = readFileSync('./drizzle/0006_cooing_peter_parker.sql', 'utf8');
const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

const conn = await mysql.createConnection(process.env.DATABASE_URL);
for (const stmt of statements) {
  console.log('Executing:', stmt.substring(0, 60) + '...');
  await conn.execute(stmt);
  console.log('OK');
}
await conn.end();
console.log('Migration complete!');
