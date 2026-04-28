import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

// Seed Accounts (Chart of Accounts)
await conn.execute(`INSERT INTO accounts (code, name, type, subtype, balance) VALUES
  ('1010','Cash','Asset','Current Asset',85000),
  ('1020','Accounts Receivable','Asset','Current Asset',42000),
  ('1030','Inventory','Asset','Current Asset',28500),
  ('1040','Prepaid Expenses','Asset','Current Asset',4200),
  ('1510','Equipment','Asset','Fixed Asset',65000),
  ('1520','Accum. Depreciation','Asset','Fixed Asset',-12000),
  ('2010','Accounts Payable','Liability','Current Liability',18500),
  ('2020','Accrued Liabilities','Liability','Current Liability',6800),
  ('2030','Payroll Taxes Payable','Liability','Current Liability',3200),
  ('2510','Notes Payable','Liability','Long-term',45000),
  ('3010','Owner Capital','Equity','Equity',100000),
  ('3020','Retained Earnings','Equity','Equity',62200),
  ('4010','Sales Revenue','Revenue','Operating',125000),
  ('4020','Service Revenue','Revenue','Operating',38500),
  ('4030','Other Income','Revenue','Non-operating',5200),
  ('5010','Cost of Goods Sold','Expense','COGS',72000),
  ('5020','Salaries Expense','Expense','Operating',48000),
  ('5030','Rent Expense','Expense','Operating',18000),
  ('5040','Utilities','Expense','Operating',4200),
  ('5050','Marketing','Expense','Operating',8500),
  ('5060','Depreciation Expense','Expense','Operating',6000),
  ('5070','Other Expenses','Expense','Operating',3800)
`);
console.log('✓ Accounts seeded');

// Seed Customers
await conn.execute(`INSERT INTO customers (name, email, phone, city, address, balance) VALUES
  ('Apex Retail Solutions','billing@apexretail.com','(212)555-0101','New York','100 5th Ave',12000),
  ('BlueLine Distributors','ap@bluelinedist.com','(310)555-0202','Los Angeles','500 Sunset Blvd',8500),
  ('Carter & Associates','finance@carterassoc.com','(312)555-0303','Chicago','200 N Lake Shore',4200),
  ('Delta Tech Corp','invoices@deltatech.io','(415)555-0404','San Francisco','1 Market St',17500),
  ('Echo Manufacturing','payables@echomfg.com','(713)555-0505','Houston','400 Texas Ave',0)
`);
console.log('✓ Customers seeded');

// Seed Vendors
await conn.execute(`INSERT INTO vendors (name, email, phone, category, address, balance) VALUES
  ('Global Supply Co.','orders@globalsupply.com','(800)555-1001','Supplier','1000 Industrial Blvd',8500),
  ('Metro Office Supplies','billing@metroos.com','(800)555-1002','Supplies','250 Commerce Dr',1200),
  ('TechCloud Inc.','invoices@techcloud.com','(800)555-1003','Software','888 Silicon Way',4500),
  ('Premier Logistics','billing@premierlog.com','(800)555-1004','Logistics','500 Freight Rd',3800),
  ('City Power & Gas','accounts@citypg.com','(800)555-1005','Utilities','1 Utility Center',500)
`);
console.log('✓ Vendors seeded');

// Seed Invoices
await conn.execute(`INSERT INTO invoices (invoiceId, customerId, customerName, date, dueDate, status, total) VALUES
  ('INV-001',1,'Apex Retail Solutions','2026-01-10','2026-02-10','Paid',12000),
  ('INV-002',2,'BlueLine Distributors','2026-02-01','2026-03-01','Sent',8500),
  ('INV-003',4,'Delta Tech Corp','2026-02-15','2026-03-15','Overdue',17500),
  ('INV-004',3,'Carter & Associates','2026-03-01','2026-04-01','Draft',4200)
`);
console.log('✓ Invoices seeded');

// Seed Invoice Lines
await conn.execute(`INSERT INTO invoice_lines (invoiceId, description, qty, rate, amount) VALUES
  (1,'Product Bundle A',10,800,8000),(1,'Installation',4,1000,4000),
  (2,'Wholesale Goods',50,150,7500),(2,'Delivery',1,1000,1000),
  (3,'Software License',5,2500,12500),(3,'Support Q1',1,5000,5000),
  (4,'Consulting',7,600,4200)
`);
console.log('✓ Invoice lines seeded');

// Seed Bills
await conn.execute(`INSERT INTO bills (billId, vendorId, vendorName, date, dueDate, amount, bill_status, description) VALUES
  ('BILL-001',1,'Global Supply Co.','2026-01-20','2026-02-20',8500,'Paid','Raw materials January'),
  ('BILL-002',3,'TechCloud Inc.','2026-02-01','2026-03-01',4500,'Paid','Annual software subscription'),
  ('BILL-003',4,'Premier Logistics','2026-02-10','2026-03-10',3800,'Pending','Freight Q1'),
  ('BILL-004',2,'Metro Office Supplies','2026-03-05','2026-04-05',1200,'Pending','Office supplies')
`);
console.log('✓ Bills seeded');

// Seed Inventory
await conn.execute(`INSERT INTO inventory (sku, name, category, qty, cost, reorder) VALUES
  ('SKU-1001','Widget Pro X','Electronics',145,89.99,50),
  ('SKU-1002','Connector Set A','Hardware',28,24.50,30),
  ('SKU-1003','Industrial Cable','Hardware',312,12.75,100),
  ('SKU-1004','Smart Sensor V2','Electronics',18,149.00,25),
  ('SKU-1005','Mounting Bracket','Hardware',89,8.99,40),
  ('SKU-1006','Power Module 500W','Electronics',42,220.00,20)
`);
console.log('✓ Inventory seeded');

// Seed Purchase Orders
await conn.execute(`INSERT INTO purchase_orders (poId, vendorId, vendorName, date, expectedDate, total, po_status, description) VALUES
  ('PO-001',1,'Global Supply Co.','2026-01-05','2026-01-15',12000,'Received','Q1 raw materials'),
  ('PO-002',4,'Premier Logistics','2026-02-20','2026-03-01',5500,'Sent','Express delivery'),
  ('PO-003',2,'Metro Office Supplies','2026-03-10','2026-03-20',1800,'Draft','Office furniture')
`);
console.log('✓ Purchase orders seeded');

// Seed Journal Entries
await conn.execute(`INSERT INTO journal_entries (entryId, date, description, posted) VALUES
  ('JE-001','2026-01-15','January sales recognition',true),
  ('JE-002','2026-01-31','January payroll',true),
  ('JE-003','2026-02-01','Rent payment February',true),
  ('JE-004','2026-02-15','Inventory purchase on account',true),
  ('JE-005','2026-03-01','Equipment depreciation Q1',false)
`);
console.log('✓ Journal entries seeded');

// Seed Journal Lines
await conn.execute(`INSERT INTO journal_lines (journalEntryId, account, debit, credit) VALUES
  (1,'Accounts Receivable',15000,0),(1,'Sales Revenue',0,15000),
  (2,'Salaries Expense',12000,0),(2,'Cash',0,9200),(2,'Payroll Taxes Payable',0,2800),
  (3,'Rent Expense',4500,0),(3,'Cash',0,4500),
  (4,'Inventory',8500,0),(4,'Accounts Payable',0,8500),
  (5,'Depreciation Expense',1500,0),(5,'Accum. Depreciation',0,1500)
`);
console.log('✓ Journal lines seeded');

// Seed Employees
await conn.execute(`INSERT INTO employees (empId, name, title, dept, emp_type, salary, rate, emp_email, startDate, active) VALUES
  ('EMP-001','Sarah Mitchell','CEO','Executive','Salaried',120000,0,'sarah@co.com','2020-01-15',true),
  ('EMP-002','James Chen','CFO','Finance','Salaried',95000,0,'james@co.com','2020-03-01',true),
  ('EMP-003','Maria Lopez','Sales Manager','Sales','Salaried',72000,0,'maria@co.com','2021-06-01',true),
  ('EMP-004','David Patel','Software Engineer','IT','Salaried',88000,0,'david@co.com','2022-01-10',true),
  ('EMP-005','Lisa Nguyen','Warehouse Lead','Operations','Hourly',0,28,'lisa@co.com','2021-09-01',true),
  ('EMP-006','Tom Bradley','Sales Rep','Sales','Hourly',0,22,'tom@co.com','2023-03-15',false)
`);
console.log('✓ Employees seeded');

// Seed Payroll Runs
await conn.execute(`INSERT INTO payroll_runs (payrollId, period, runDate, gross, fedTax, stateTax, ssMed, net, payroll_status) VALUES
  ('PR-001','January 2026','2026-01-31',39600,7920,1980,2920,26780,'Processed'),
  ('PR-002','February 2026','2026-02-28',39600,7920,1980,2920,26780,'Processed'),
  ('PR-003','March 2026','2026-03-31',39600,7920,1980,2920,26780,'Processed')
`);
console.log('✓ Payroll runs seeded');

// Seed Warehouses
await conn.execute(`INSERT INTO warehouses (name, location, capacity, manager) VALUES
  ('Main Warehouse','1000 Industrial Blvd, Houston TX',5000,'Lisa Nguyen'),
  ('East Coast Hub','500 Commerce Dr, New York NY',3000,'James Chen'),
  ('West Coast Hub','200 Pacific Ave, Los Angeles CA',2500,'Maria Lopez')
`);
console.log('✓ Warehouses seeded');

// Seed Supply Chain Orders
await conn.execute(`INSERT INTO supply_chain_orders (orderId, supplierName, itemName, qty, sc_status, orderDate, expectedDate) VALUES
  ('SC-001','Global Supply Co.','Widget Pro X',200,'Delivered','2026-01-05','2026-01-20'),
  ('SC-002','Premier Logistics','Connector Set A',100,'In Transit','2026-03-01','2026-03-15'),
  ('SC-003','Metro Office Supplies','Office Furniture',10,'Ordered','2026-03-20','2026-04-10')
`);
console.log('✓ Supply chain orders seeded');

// Seed Delivery Staff
await conn.execute(`INSERT INTO delivery_staff (staffId, name, phone, ds_email, vehicleType, vehicleNumber, ds_active) VALUES
  ('DS-001','Raj Kumar','(555)100-0001','raj@delivery.com','Van','TX-1234',true),
  ('DS-002','Ahmed Ali','(555)100-0002','ahmed@delivery.com','Truck','TX-5678',true),
  ('DS-003','Mike Johnson','(555)100-0003','mike@delivery.com','Bike','TX-9012',false)
`);
console.log('✓ Delivery staff seeded');

// Seed Deliveries
await conn.execute(`INSERT INTO deliveries (deliveryId, staffId, staffName, del_customerName, del_address, del_status, del_invoiceId) VALUES
  ('DEL-001',1,'Raj Kumar','Apex Retail Solutions','100 5th Ave, New York','Delivered','INV-001'),
  ('DEL-002',2,'Ahmed Ali','BlueLine Distributors','500 Sunset Blvd, LA','In Transit','INV-002'),
  ('DEL-003',NULL,NULL,'Delta Tech Corp','1 Market St, SF','Pending','INV-003')
`);
console.log('✓ Deliveries seeded');

// Seed Settings
await conn.execute(`INSERT INTO settings (setting_key, setting_value) VALUES
  ('company_name','KukBook ERP'),
  ('company_email','admin@kukbook.com'),
  ('company_phone','(800)555-0000'),
  ('company_address','100 Business Park, Houston TX'),
  ('currency','USD'),
  ('tax_rate','7.5')
`);
console.log('✓ Settings seeded');

await conn.end();
console.log('\\n🎉 All seed data inserted successfully!');
