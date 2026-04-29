import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const url = process.env.DATABASE_URL;
const conn = await mysql.createConnection(url);

const sql = readFileSync(new URL('./migrate-medium-priority.sql', import.meta.url), 'utf8');
const statements = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));

for (const stmt of statements) {
  try {
    await conn.execute(stmt);
    console.log('OK:', stmt.slice(0, 60));
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('SKIP (already exists):', stmt.slice(0, 60));
    } else {
      console.error('ERR:', e.message, '\n  SQL:', stmt.slice(0, 80));
    }
  }
}

await conn.end();
console.log('Migration complete');
