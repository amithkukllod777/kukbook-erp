-- Medium Priority Features Migration

-- 1. Proforma Invoices
CREATE TABLE IF NOT EXISTS proforma_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  proformaId VARCHAR(50) NOT NULL,
  customerId INT,
  customerName VARCHAR(255),
  date VARCHAR(20),
  validUntil VARCHAR(20),
  status ENUM('Draft', 'Sent', 'Accepted', 'Rejected', 'Converted') DEFAULT 'Draft',
  subtotal DECIMAL(15,2) DEFAULT 0,
  cgst DECIMAL(15,2) DEFAULT 0,
  sgst DECIMAL(15,2) DEFAULT 0,
  igst DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  lineItems JSON,
  convertedInvoiceId INT,
  placeOfSupply VARCHAR(100),
  gstRate VARCHAR(10),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Batch / Expiry Tracking
CREATE TABLE IF NOT EXISTS inventory_batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  batchNumber VARCHAR(100) NOT NULL,
  manufacturingDate VARCHAR(20),
  expiryDate VARCHAR(20),
  quantity INT DEFAULT 0,
  purchasePrice DECIMAL(15,2) DEFAULT 0,
  sellingPrice DECIMAL(15,2) DEFAULT 0,
  status ENUM('active', 'expired', 'consumed') DEFAULT 'active',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Approval Workflows
CREATE TABLE IF NOT EXISTS approval_workflows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  entityType ENUM('purchase_order', 'expense', 'bill', 'invoice', 'credit_note') NOT NULL,
  entityId INT NOT NULL,
  entityRef VARCHAR(100),
  requestedBy INT,
  requestedByName VARCHAR(255),
  approverUserId INT,
  approverName VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  comments TEXT,
  requestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolvedAt TIMESTAMP NULL
);

-- 4. Top Customers / Products (no new table needed - computed from existing data)
-- Will use existing invoices + inventory data for ranking

-- 5. Invoice Templates (add templateId to invoices)
ALTER TABLE invoices ADD COLUMN templateId VARCHAR(50) DEFAULT 'classic';

-- 6. E-Way Bill (already has eway_bills table, add NIC API fields)
ALTER TABLE eway_bills ADD COLUMN nicEwbNo VARCHAR(50);
ALTER TABLE eway_bills ADD COLUMN nicEwbDate VARCHAR(30);
ALTER TABLE eway_bills ADD COLUMN nicValidUpto VARCHAR(30);
ALTER TABLE eway_bills ADD COLUMN nicStatus VARCHAR(30) DEFAULT 'pending';
ALTER TABLE eway_bills ADD COLUMN nicErrorMessage TEXT;
