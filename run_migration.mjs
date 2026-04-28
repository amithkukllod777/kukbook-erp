import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }

const conn = await mysql.createConnection(url);

const stmts = [
  // 1. accounts
  "ALTER TABLE accounts ADD COLUMN parentId int DEFAULT NULL",
  "ALTER TABLE accounts ADD COLUMN isGroup tinyint(1) NOT NULL DEFAULT 0",
  "ALTER TABLE accounts ADD COLUMN nature enum('Debit','Credit') NOT NULL DEFAULT 'Debit'",
  "ALTER TABLE accounts CHANGE COLUMN balance openingBalance decimal(15,2) NOT NULL DEFAULT '0'",
  "ALTER TABLE accounts ADD COLUMN acct_description text DEFAULT NULL",
  "ALTER TABLE accounts ADD COLUMN isSystemAccount tinyint(1) NOT NULL DEFAULT 0",
  // 2. journal_entries
  "ALTER TABLE journal_entries ADD COLUMN sourceType varchar(30) DEFAULT NULL",
  "ALTER TABLE journal_entries ADD COLUMN sourceId int DEFAULT NULL",
  // 3. journal_lines
  "ALTER TABLE journal_lines ADD COLUMN jl_accountId int NOT NULL DEFAULT 0",
  "ALTER TABLE journal_lines CHANGE COLUMN account jl_accountName varchar(200) NOT NULL",
  "ALTER TABLE journal_lines ADD COLUMN jl_narration varchar(500) DEFAULT NULL",
  // 4. customers
  "ALTER TABLE customers ADD COLUMN cust_gstin varchar(20) DEFAULT NULL",
  "ALTER TABLE customers ADD COLUMN cust_state varchar(100) DEFAULT NULL",
  "ALTER TABLE customers ADD COLUMN cust_accountId int DEFAULT NULL",
  "ALTER TABLE customers DROP COLUMN balance",
  // 5. vendors
  "ALTER TABLE vendors ADD COLUMN vend_gstin varchar(20) DEFAULT NULL",
  "ALTER TABLE vendors ADD COLUMN vend_state varchar(100) DEFAULT NULL",
  "ALTER TABLE vendors ADD COLUMN vend_accountId int DEFAULT NULL",
  "ALTER TABLE vendors DROP COLUMN balance",
  // 6. invoices
  "ALTER TABLE invoices ADD COLUMN subtotal decimal(15,2) NOT NULL DEFAULT '0'",
  "ALTER TABLE invoices ADD COLUMN inv_cgst decimal(15,2) NOT NULL DEFAULT '0'",
  "ALTER TABLE invoices ADD COLUMN inv_sgst decimal(15,2) NOT NULL DEFAULT '0'",
  "ALTER TABLE invoices ADD COLUMN inv_igst decimal(15,2) NOT NULL DEFAULT '0'",
  "ALTER TABLE invoices ADD COLUMN inv_journalEntryId int DEFAULT NULL",
  // 7. invoice_lines
  "ALTER TABLE invoice_lines ADD COLUMN il_hsnCode varchar(20) DEFAULT NULL",
  "ALTER TABLE invoice_lines ADD COLUMN il_gstRate decimal(5,2) NOT NULL DEFAULT '0'",
  // 8. bills
  "ALTER TABLE bills ADD COLUMN bill_subtotal decimal(15,2) NOT NULL DEFAULT '0'",
  "ALTER TABLE bills ADD COLUMN bill_cgst decimal(15,2) NOT NULL DEFAULT '0'",
  "ALTER TABLE bills ADD COLUMN bill_sgst decimal(15,2) NOT NULL DEFAULT '0'",
  "ALTER TABLE bills ADD COLUMN bill_igst decimal(15,2) NOT NULL DEFAULT '0'",
  "ALTER TABLE bills ADD COLUMN bill_journalEntryId int DEFAULT NULL",
  // 9. payments_in
  "ALTER TABLE payments_in ADD COLUMN pi_journalEntryId int DEFAULT NULL",
  // 10. payments_out
  "ALTER TABLE payments_out ADD COLUMN po_journalEntryId int DEFAULT NULL",
  // 11. expenses
  "ALTER TABLE expenses ADD COLUMN exp_accountId int DEFAULT NULL",
  "ALTER TABLE expenses ADD COLUMN exp_journalEntryId int DEFAULT NULL",
  // 12. other_income
  "ALTER TABLE other_income ADD COLUMN oi_accountId int DEFAULT NULL",
  "ALTER TABLE other_income ADD COLUMN oi_journalEntryId int DEFAULT NULL",
  // 13. sale_returns
  "ALTER TABLE sale_returns ADD COLUMN sr_journalEntryId int DEFAULT NULL",
  // 14. purchase_returns
  "ALTER TABLE purchase_returns ADD COLUMN pr_journalEntryId int DEFAULT NULL",
  // 15. cash_bank_accounts
  "ALTER TABLE cash_bank_accounts ADD COLUMN cb_linkedAccountId int DEFAULT NULL",
  "ALTER TABLE cash_bank_accounts DROP COLUMN cb_balance",
  // 16. companies
  "ALTER TABLE companies ADD COLUMN fy_start varchar(10) DEFAULT '04-01'",
];

let ok = 0, skip = 0;
for (const sql of stmts) {
  try {
    await conn.query(sql);
    ok++;
    console.log(`OK: ${sql.substring(0, 80)}...`);
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_CANT_DROP_FIELD_OR_KEY' || e.message.includes('Duplicate column')) {
      skip++;
      console.log(`SKIP (already exists): ${sql.substring(0, 60)}...`);
    } else {
      console.error(`FAIL: ${sql.substring(0, 60)}...`);
      console.error(`  Error: ${e.message}`);
    }
  }
}

console.log(`\nDone: ${ok} applied, ${skip} skipped`);
await conn.end();
