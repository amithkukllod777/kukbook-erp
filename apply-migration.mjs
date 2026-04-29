import mysql from 'mysql2/promise';

const url = new URL(process.env.DATABASE_URL);
const connection = await mysql.createConnection({
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: 'Amazon RDS',
});

const sql = `
ALTER TABLE \`invoices\` 
ADD COLUMN \`po_number\` varchar(50),
ADD COLUMN \`po_date\` varchar(10),
ADD COLUMN \`eway_bill_number\` varchar(50),
ADD COLUMN \`invoice_format\` varchar(50) DEFAULT 'professional';

ALTER TABLE \`invoice_lines\`
ADD COLUMN \`batch_number\` varchar(100),
ADD COLUMN \`expiry_date\` varchar(10),
ADD COLUMN \`mfg_date\` varchar(10),
ADD COLUMN \`mrp\` decimal(15,2),
ADD COLUMN \`taxable_price\` decimal(15,2),
ADD COLUMN \`upc\` varchar(50);
`;

try {
  await connection.query(sql);
  console.log('✅ Migration applied successfully!');
  process.exit(0);
} catch (err) {
  if (err.code === 'ER_DUP_FIELDNAME') {
    console.log('✅ Columns already exist - no action needed');
    process.exit(0);
  }
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
}
finally {
  await connection.end();
}
