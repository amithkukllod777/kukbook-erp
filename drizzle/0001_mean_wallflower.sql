CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(200) NOT NULL,
	`type` enum('Asset','Liability','Equity','Revenue','Expense') NOT NULL,
	`subtype` varchar(100),
	`balance` decimal(15,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`billId` varchar(20) NOT NULL,
	`vendorId` int NOT NULL,
	`vendorName` varchar(200) NOT NULL,
	`date` varchar(10) NOT NULL,
	`dueDate` varchar(10) NOT NULL,
	`amount` decimal(15,2) NOT NULL DEFAULT '0',
	`bill_status` enum('Pending','Paid') NOT NULL DEFAULT 'Pending',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bills_id` PRIMARY KEY(`id`),
	CONSTRAINT `bills_billId_unique` UNIQUE(`billId`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`city` varchar(100),
	`address` text,
	`balance` decimal(15,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` varchar(20) NOT NULL,
	`staffId` int,
	`staffName` varchar(200),
	`del_customerName` varchar(200) NOT NULL,
	`del_address` text,
	`del_status` enum('Pending','Assigned','In Transit','Delivered','Failed') NOT NULL DEFAULT 'Pending',
	`del_invoiceId` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `deliveries_deliveryId_unique` UNIQUE(`deliveryId`)
);
--> statement-breakpoint
CREATE TABLE `delivery_staff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` varchar(20) NOT NULL,
	`name` varchar(200) NOT NULL,
	`phone` varchar(50),
	`ds_email` varchar(320),
	`vehicleType` varchar(50),
	`vehicleNumber` varchar(50),
	`ds_active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `delivery_staff_id` PRIMARY KEY(`id`),
	CONSTRAINT `delivery_staff_staffId_unique` UNIQUE(`staffId`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`empId` varchar(20) NOT NULL,
	`name` varchar(200) NOT NULL,
	`title` varchar(200),
	`dept` varchar(100),
	`emp_type` enum('Salaried','Hourly') NOT NULL DEFAULT 'Salaried',
	`salary` decimal(15,2) NOT NULL DEFAULT '0',
	`rate` decimal(10,2) NOT NULL DEFAULT '0',
	`emp_email` varchar(320),
	`startDate` varchar(10),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_empId_unique` UNIQUE(`empId`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(50) NOT NULL,
	`name` varchar(200) NOT NULL,
	`category` varchar(100),
	`qty` int NOT NULL DEFAULT 0,
	`cost` decimal(15,2) NOT NULL DEFAULT '0',
	`reorder` int NOT NULL DEFAULT 10,
	`warehouseId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`qty` int NOT NULL DEFAULT 1,
	`rate` decimal(15,2) NOT NULL DEFAULT '0',
	`amount` decimal(15,2) NOT NULL DEFAULT '0',
	CONSTRAINT `invoice_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` varchar(20) NOT NULL,
	`customerId` int NOT NULL,
	`customerName` varchar(200) NOT NULL,
	`date` varchar(10) NOT NULL,
	`dueDate` varchar(10) NOT NULL,
	`status` enum('Draft','Sent','Paid','Overdue') NOT NULL DEFAULT 'Draft',
	`total` decimal(15,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceId_unique` UNIQUE(`invoiceId`)
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entryId` varchar(20) NOT NULL,
	`date` varchar(10) NOT NULL,
	`description` text,
	`posted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `journal_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `journal_entries_entryId_unique` UNIQUE(`entryId`)
);
--> statement-breakpoint
CREATE TABLE `journal_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`journalEntryId` int NOT NULL,
	`account` varchar(200) NOT NULL,
	`debit` decimal(15,2) NOT NULL DEFAULT '0',
	`credit` decimal(15,2) NOT NULL DEFAULT '0',
	CONSTRAINT `journal_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payroll_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payrollId` varchar(20) NOT NULL,
	`period` varchar(50) NOT NULL,
	`runDate` varchar(10) NOT NULL,
	`gross` decimal(15,2) NOT NULL DEFAULT '0',
	`fedTax` decimal(15,2) NOT NULL DEFAULT '0',
	`stateTax` decimal(15,2) NOT NULL DEFAULT '0',
	`ssMed` decimal(15,2) NOT NULL DEFAULT '0',
	`net` decimal(15,2) NOT NULL DEFAULT '0',
	`payroll_status` varchar(20) NOT NULL DEFAULT 'Processed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payroll_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `payroll_runs_payrollId_unique` UNIQUE(`payrollId`)
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`poId` varchar(20) NOT NULL,
	`vendorId` int NOT NULL,
	`vendorName` varchar(200) NOT NULL,
	`date` varchar(10) NOT NULL,
	`expectedDate` varchar(10),
	`total` decimal(15,2) NOT NULL DEFAULT '0',
	`po_status` enum('Draft','Sent','Received') NOT NULL DEFAULT 'Draft',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchase_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchase_orders_poId_unique` UNIQUE(`poId`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`setting_key` varchar(100) NOT NULL,
	`setting_value` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_setting_key_unique` UNIQUE(`setting_key`)
);
--> statement-breakpoint
CREATE TABLE `supply_chain_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` varchar(20) NOT NULL,
	`supplierName` varchar(200) NOT NULL,
	`itemName` varchar(200) NOT NULL,
	`qty` int NOT NULL DEFAULT 0,
	`sc_status` enum('Ordered','In Transit','Delivered','Cancelled') NOT NULL DEFAULT 'Ordered',
	`orderDate` varchar(10) NOT NULL,
	`expectedDate` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supply_chain_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `supply_chain_orders_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`category` varchar(100),
	`address` text,
	`balance` decimal(15,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warehouses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`location` varchar(300),
	`capacity` int DEFAULT 0,
	`manager` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warehouses_id` PRIMARY KEY(`id`)
);
