import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
  const conn = await mysql.createConnection(url);
  const sql = fs.readFileSync(path.join(__dirname, 'migrate-addresses.sql'), 'utf8');
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
  
  for (const stmt of statements) {
    if (stmt.startsWith('--')) continue;
    try {
      await conn.execute(stmt);
      console.log('OK:', stmt.substring(0, 80));
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('SKIP (already exists):', stmt.substring(0, 80));
      } else {
        console.error('ERR:', e.message, '\n  SQL:', stmt.substring(0, 80));
      }
    }
  }
  await conn.end();
  console.log('Migration complete!');
}

run();
