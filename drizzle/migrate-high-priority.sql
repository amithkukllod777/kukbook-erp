-- Migration: High Priority Features
-- 1. Partial Payments / Due Tracking (add paidAmount and dueAmount to invoices)
-- 2. Recurring Invoices (new table)
-- 3. Activity / Audit Log (new table)
-- 4. Bank Reconciliation (new table)
-- 5. Credit Limit on Customers (add creditLimit column)

-- ═══════════════════════════════════════════════════════════════════════
-- 1. PARTIAL PAYMENTS — Add paid/due tracking to invoices
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE invoices ADD COLUMN paidAmount DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN dueAmount DECIMAL(15,2) NOT NULL DEFAULT 0;

-- Also add invoiceId reference to payments_in for linking partial payments
ALTER TABLE payments_in ADD COLUMN pi_invoiceId INT NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. RECURRING INVOICES — Template for auto-generation
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT,
  customerId INT NOT NULL,
  customerName VARCHAR(200) NOT NULL,
  frequency ENUM('weekly', 'monthly', 'quarterly', 'yearly') NOT NULL DEFAULT 'monthly',
  startDate VARCHAR(10) NOT NULL,
  endDate VARCHAR(10),
  nextDueDate VARCHAR(10) NOT NULL,
  lastGeneratedDate VARCHAR(10),
  status ENUM('active', 'paused', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  cgst DECIMAL(15,2) NOT NULL DEFAULT 0,
  sgst DECIMAL(15,2) NOT NULL DEFAULT 0,
  igst DECIMAL(15,2) NOT NULL DEFAULT 0,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  lineItems JSON,
  notes TEXT,
  generatedCount INT NOT NULL DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. ACTIVITY / AUDIT LOG
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT,
  userId INT NOT NULL,
  userName VARCHAR(200),
  action VARCHAR(50) NOT NULL,
  entityType VARCHAR(50) NOT NULL,
  entityId INT,
  entityName VARCHAR(200),
  details JSON,
  ipAddress VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. BANK RECONCILIATION
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bank_reconciliations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT,
  accountId INT NOT NULL,
  accountName VARCHAR(200) NOT NULL,
  statementDate VARCHAR(10) NOT NULL,
  statementBalance DECIMAL(15,2) NOT NULL DEFAULT 0,
  bookBalance DECIMAL(15,2) NOT NULL DEFAULT 0,
  difference DECIMAL(15,2) NOT NULL DEFAULT 0,
  status ENUM('draft', 'reconciled') NOT NULL DEFAULT 'draft',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_reconciliation_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reconciliationId INT NOT NULL,
  transactionDate VARCHAR(10) NOT NULL,
  description VARCHAR(500),
  referenceNo VARCHAR(100),
  debit DECIMAL(15,2) NOT NULL DEFAULT 0,
  credit DECIMAL(15,2) NOT NULL DEFAULT 0,
  isMatched BOOLEAN NOT NULL DEFAULT FALSE,
  matchedJournalEntryId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. CREDIT LIMIT ON CUSTOMERS
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE customers ADD COLUMN cust_creditLimit DECIMAL(15,2) DEFAULT NULL;
ALTER TABLE customers ADD COLUMN cust_currentBalance DECIMAL(15,2) NOT NULL DEFAULT 0;
