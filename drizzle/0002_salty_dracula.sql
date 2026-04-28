CREATE TABLE `cash_bank_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cb_name` varchar(200) NOT NULL,
	`cb_type` enum('Cash','Bank','UPI','Wallet') NOT NULL DEFAULT 'Cash',
	`bankName` varchar(200),
	`accountNumber` varchar(50),
	`cb_balance` decimal(15,2) NOT NULL DEFAULT '0',
	`cb_createdAt` timestamp NOT NULL DEFAULT (now()),
	`cb_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cash_bank_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estimate_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`el_estimateId` int NOT NULL,
	`el_description` varchar(500) NOT NULL,
	`el_qty` int NOT NULL DEFAULT 1,
	`el_rate` decimal(15,2) NOT NULL DEFAULT '0',
	`el_amount` decimal(15,2) NOT NULL DEFAULT '0',
	CONSTRAINT `estimate_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estimates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`estimateId` varchar(20) NOT NULL,
	`est_customerId` int NOT NULL,
	`est_customerName` varchar(200) NOT NULL,
	`est_date` varchar(10) NOT NULL,
	`validUntil` varchar(10),
	`est_total` decimal(15,2) NOT NULL DEFAULT '0',
	`est_status` enum('Draft','Sent','Accepted','Rejected','Expired') NOT NULL DEFAULT 'Draft',
	`est_notes` text,
	`est_createdAt` timestamp NOT NULL DEFAULT (now()),
	`est_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `estimates_id` PRIMARY KEY(`id`),
	CONSTRAINT `estimates_estimateId_unique` UNIQUE(`estimateId`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expenseId` varchar(20) NOT NULL,
	`exp_date` varchar(10) NOT NULL,
	`exp_category` varchar(100) NOT NULL,
	`exp_amount` decimal(15,2) NOT NULL DEFAULT '0',
	`exp_paymentMode` varchar(50) NOT NULL DEFAULT 'Cash',
	`exp_description` text,
	`gstIncluded` boolean NOT NULL DEFAULT false,
	`gstAmount` decimal(15,2) DEFAULT '0',
	`exp_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`),
	CONSTRAINT `expenses_expenseId_unique` UNIQUE(`expenseId`)
);
--> statement-breakpoint
CREATE TABLE `other_income` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incomeId` varchar(20) NOT NULL,
	`oi_date` varchar(10) NOT NULL,
	`oi_category` varchar(100) NOT NULL,
	`oi_amount` decimal(15,2) NOT NULL DEFAULT '0',
	`oi_paymentMode` varchar(50) NOT NULL DEFAULT 'Cash',
	`oi_description` text,
	`oi_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `other_income_id` PRIMARY KEY(`id`),
	CONSTRAINT `other_income_incomeId_unique` UNIQUE(`incomeId`)
);
--> statement-breakpoint
CREATE TABLE `payments_in` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pi_paymentId` varchar(20) NOT NULL,
	`pi_customerId` int NOT NULL,
	`pi_customerName` varchar(200) NOT NULL,
	`pi_date` varchar(10) NOT NULL,
	`pi_amount` decimal(15,2) NOT NULL DEFAULT '0',
	`pi_mode` varchar(50) NOT NULL DEFAULT 'Cash',
	`pi_invoiceRef` varchar(20),
	`pi_notes` text,
	`pi_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_in_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_in_pi_paymentId_unique` UNIQUE(`pi_paymentId`)
);
--> statement-breakpoint
CREATE TABLE `payments_out` (
	`id` int AUTO_INCREMENT NOT NULL,
	`po_paymentId` varchar(20) NOT NULL,
	`po_vendorId` int NOT NULL,
	`po_vendorName` varchar(200) NOT NULL,
	`po_date` varchar(10) NOT NULL,
	`po_amount` decimal(15,2) NOT NULL DEFAULT '0',
	`po_mode` varchar(50) NOT NULL DEFAULT 'Cash',
	`po_billRef` varchar(20),
	`po_notes` text,
	`po_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_out_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_out_po_paymentId_unique` UNIQUE(`po_paymentId`)
);
--> statement-breakpoint
CREATE TABLE `purchase_returns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pr_returnId` varchar(20) NOT NULL,
	`pr_vendorId` int NOT NULL,
	`pr_vendorName` varchar(200) NOT NULL,
	`pr_date` varchar(10) NOT NULL,
	`billRef` varchar(20),
	`pr_amount` decimal(15,2) NOT NULL DEFAULT '0',
	`pr_reason` text,
	`pr_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchase_returns_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchase_returns_pr_returnId_unique` UNIQUE(`pr_returnId`)
);
--> statement-breakpoint
CREATE TABLE `sale_returns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`returnId` varchar(20) NOT NULL,
	`customerId` int NOT NULL,
	`sr_customerName` varchar(200) NOT NULL,
	`sr_date` varchar(10) NOT NULL,
	`invoiceRef` varchar(20),
	`sr_amount` decimal(15,2) NOT NULL DEFAULT '0',
	`reason` text,
	`sr_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sale_returns_id` PRIMARY KEY(`id`),
	CONSTRAINT `sale_returns_returnId_unique` UNIQUE(`returnId`)
);
