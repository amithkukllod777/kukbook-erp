import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

const sql = readFileSync('./drizzle/0007_lush_madame_masque.sql', 'utf8');
const stmts = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

const conn = await mysql.createConnection(process.env.DATABASE_URL);
for (const stmt of stmts) {
  try {
    await conn.execute(stmt);
    console.log('OK:', stmt.substring(0, 60));
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') { console.log('SKIP (exists):', stmt.substring(0, 60)); }
    else { console.error('ERR:', e.message, stmt.substring(0, 60)); }
  }
}
await conn.end();
console.log('Done!');
