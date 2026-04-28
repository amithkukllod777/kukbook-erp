import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const conn = await mysql.createConnection(url);

const statements = [
  // Employee Indian salary structure
  "ALTER TABLE employees ADD COLUMN basicSalary DECIMAL(15,2) DEFAULT 0 NOT NULL",
  "ALTER TABLE employees ADD COLUMN hra DECIMAL(15,2) DEFAULT 0 NOT NULL",
  "ALTER TABLE employees ADD COLUMN da DECIMAL(15,2) DEFAULT 0 NOT NULL",
  "ALTER TABLE employees ADD COLUMN specialAllowance DECIMAL(15,2) DEFAULT 0 NOT NULL",
  "ALTER TABLE employees ADD COLUMN panNumber VARCHAR(10)",
  "ALTER TABLE employees ADD COLUMN uanNumber VARCHAR(20)",
  "ALTER TABLE employees ADD COLUMN esiNumber VARCHAR(20)",
  "ALTER TABLE employees ADD COLUMN pfOptOut TINYINT(1) DEFAULT 0 NOT NULL",
  // Payroll runs Indian deductions
  "ALTER TABLE payroll_runs ADD COLUMN basicPay DECIMAL(15,2) DEFAULT 0 NOT NULL",
  "ALTER TABLE payroll_runs ADD COLUMN hra_amt DECIMAL(15,2) DEFAULT 0 NOT NULL",
  "ALTER TABLE payroll_runs ADD COLUMN da_amt DECIMAL(15,2) DEFAULT 0 NOT NULL",
  "ALTER TABLE payroll_runs ADD COLUMN specialAllow DECIMAL(15,2) DEFAULT 0 NOT NULL",
  "ALTER TABLE payroll_runs ADD COLUMN pfEmployee DECIMAL(15,2) DEFAULT 0 NOT NULL",
  "ALTER TABLE payroll_runs ADD COLUMN pfEmployer DECIMAL(15,2) DEFAULT 0 NOT NULL",
  "ALTER TABLE payroll_runs ADD COLUMN esiEmployee DECIMAL(15,2) DEFAULT 0 NOT NULL",
  "ALTER TABLE payroll_runs ADD COLUMN esiEmployer DECIMAL(15,2) DEFAULT 0 NOT NULL",
  "ALTER TABLE payroll_runs ADD COLUMN professionalTax DECIMAL(15,2) DEFAULT 0 NOT NULL",
  "ALTER TABLE payroll_runs ADD COLUMN tds DECIMAL(15,2) DEFAULT 0 NOT NULL",
];

let ok = 0, skip = 0;
for (const sql of statements) {
  try {
    await conn.execute(sql);
    ok++;
    console.log(`OK: ${sql.substring(0, 80)}...`);
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      skip++;
      console.log(`SKIP (exists): ${sql.substring(0, 60)}...`);
    } else {
      console.error(`FAIL: ${sql.substring(0, 60)}... → ${e.message}`);
    }
  }
}

console.log(`\nDone: ${ok} applied, ${skip} skipped`);
await conn.end();
