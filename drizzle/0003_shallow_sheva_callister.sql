CREATE TABLE `delivery_challans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challanId` varchar(20) NOT NULL,
	`dc_customerId` int NOT NULL,
	`dc_customerName` varchar(200) NOT NULL,
	`dc_date` varchar(10) NOT NULL,
	`dc_invoiceRef` varchar(20),
	`dc_items` json,
	`transportMode` varchar(100),
	`dc_vehicleNumber` varchar(50),
	`dc_status` enum('Draft','Sent','Delivered') NOT NULL DEFAULT 'Draft',
	`dc_notes` text,
	`dc_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `delivery_challans_id` PRIMARY KEY(`id`),
	CONSTRAINT `delivery_challans_challanId_unique` UNIQUE(`challanId`)
);
--> statement-breakpoint
CREATE TABLE `party_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pg_name` varchar(200) NOT NULL,
	`pg_type` enum('Customer','Vendor') NOT NULL,
	`pg_description` text,
	`pg_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `party_groups_id` PRIMARY KEY(`id`)
);
