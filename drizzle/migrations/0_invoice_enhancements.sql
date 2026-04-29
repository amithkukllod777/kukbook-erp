-- Add new fields to invoices table for PO, E-way Bill, and format selection
ALTER TABLE `invoices` 
ADD COLUMN `po_number` varchar(50),
ADD COLUMN `po_date` varchar(10),
ADD COLUMN `eway_bill_number` varchar(50),
ADD COLUMN `invoice_format` varchar(50) DEFAULT 'professional';

-- Add new fields to invoice_lines table for batch, expiry, MFG, MRP, taxable price, UPC
ALTER TABLE `invoice_lines`
ADD COLUMN `batch_number` varchar(100),
ADD COLUMN `expiry_date` varchar(10),
ADD COLUMN `mfg_date` varchar(10),
ADD COLUMN `mrp` decimal(15,2),
ADD COLUMN `taxable_price` decimal(15,2),
ADD COLUMN `upc` varchar(50);
