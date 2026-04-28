import mysql from 'mysql2/promise';
import fs from 'fs';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const sql = fs.readFileSync('./drizzle/migration_remaining.sql', 'utf8');
const statements = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));

async function run() {
  const conn = await mysql.createConnection(url);
  for (const stmt of statements) {
    try {
      await conn.execute(stmt);
      console.log('OK:', stmt.substring(0, 80));
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_TABLE_EXISTS_ERROR' || e.message?.includes('Duplicate column')) {
        console.log('SKIP (exists):', stmt.substring(0, 80));
      } else {
        console.error('FAIL:', stmt.substring(0, 80), e.message);
      }
    }
  }
  await conn.end();
  console.log('Migration complete');
}
run();
