-- Migration: TDS on Bills, TCS on Invoices, Company Invites, Verification Codes

-- 1. TDS fields on bills
ALTER TABLE bills ADD COLUMN tds_section VARCHAR(20) DEFAULT NULL;
ALTER TABLE bills ADD COLUMN tds_rate DECIMAL(5,2) DEFAULT 0 NOT NULL;
ALTER TABLE bills ADD COLUMN tds_amount DECIMAL(15,2) DEFAULT 0 NOT NULL;
ALTER TABLE bills ADD COLUMN tds_net_payable DECIMAL(15,2) DEFAULT 0 NOT NULL;

-- 2. TCS fields on invoices
ALTER TABLE invoices ADD COLUMN tcs_section VARCHAR(20) DEFAULT NULL;
ALTER TABLE invoices ADD COLUMN tcs_rate DECIMAL(5,2) DEFAULT 0 NOT NULL;
ALTER TABLE invoices ADD COLUMN tcs_amount DECIMAL(15,2) DEFAULT 0 NOT NULL;
ALTER TABLE invoices ADD COLUMN tcs_total DECIMAL(15,2) DEFAULT 0 NOT NULL;

-- 3. Company invites table
CREATE TABLE IF NOT EXISTS company_invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ci_companyId INT NOT NULL,
  email VARCHAR(320) NOT NULL,
  ci_role ENUM('admin','staff','viewer') DEFAULT 'staff' NOT NULL,
  token VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('pending','accepted','expired','cancelled') DEFAULT 'pending' NOT NULL,
  invitedBy INT NOT NULL,
  ci_createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expiresAt TIMESTAMP NOT NULL
);

-- 4. Verification codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vc_userId INT NOT NULL,
  vc_type ENUM('email','phone') NOT NULL,
  vc_target VARCHAR(320) NOT NULL,
  code VARCHAR(10) NOT NULL,
  verified BOOLEAN DEFAULT FALSE NOT NULL,
  attempts INT DEFAULT 0 NOT NULL,
  vc_createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  vc_expiresAt TIMESTAMP NOT NULL
);
