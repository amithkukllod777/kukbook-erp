-- Add PAN and Billing/Shipping address columns to customers table
ALTER TABLE `customers` ADD COLUMN `cust_pan` varchar(15);
ALTER TABLE `customers` ADD COLUMN `cust_billing_addr1` varchar(500);
ALTER TABLE `customers` ADD COLUMN `cust_billing_addr2` varchar(500);
ALTER TABLE `customers` ADD COLUMN `cust_billing_city` varchar(100);
ALTER TABLE `customers` ADD COLUMN `cust_billing_state` varchar(100);
ALTER TABLE `customers` ADD COLUMN `cust_billing_pincode` varchar(10);
ALTER TABLE `customers` ADD COLUMN `cust_shipping_addr1` varchar(500);
ALTER TABLE `customers` ADD COLUMN `cust_shipping_addr2` varchar(500);
ALTER TABLE `customers` ADD COLUMN `cust_shipping_city` varchar(100);
ALTER TABLE `customers` ADD COLUMN `cust_shipping_state` varchar(100);
ALTER TABLE `customers` ADD COLUMN `cust_shipping_pincode` varchar(10);

-- Add PAN and Billing/Shipping address columns to vendors table
ALTER TABLE `vendors` ADD COLUMN `vend_pan` varchar(15);
ALTER TABLE `vendors` ADD COLUMN `vend_billing_addr1` varchar(500);
ALTER TABLE `vendors` ADD COLUMN `vend_billing_addr2` varchar(500);
ALTER TABLE `vendors` ADD COLUMN `vend_billing_city` varchar(100);
ALTER TABLE `vendors` ADD COLUMN `vend_billing_state` varchar(100);
ALTER TABLE `vendors` ADD COLUMN `vend_billing_pincode` varchar(10);
ALTER TABLE `vendors` ADD COLUMN `vend_shipping_addr1` varchar(500);
ALTER TABLE `vendors` ADD COLUMN `vend_shipping_addr2` varchar(500);
ALTER TABLE `vendors` ADD COLUMN `vend_shipping_city` varchar(100);
ALTER TABLE `vendors` ADD COLUMN `vend_shipping_state` varchar(100);
ALTER TABLE `vendors` ADD COLUMN `vend_shipping_pincode` varchar(10);
