CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`company_name` varchar(200) NOT NULL,
	`company_slug` varchar(100) NOT NULL,
	`company_gstin` varchar(20),
	`company_pan` varchar(15),
	`company_address` text,
	`company_city` varchar(100),
	`company_state` varchar(100),
	`company_country` varchar(100) DEFAULT 'India',
	`company_phone` varchar(20),
	`company_email` varchar(320),
	`company_logo` text,
	`company_industry` varchar(100),
	`company_ownerId` int NOT NULL,
	`company_createdAt` timestamp NOT NULL DEFAULT (now()),
	`company_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_company_slug_unique` UNIQUE(`company_slug`)
);
--> statement-breakpoint
CREATE TABLE `company_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cm_companyId` int NOT NULL,
	`cm_userId` int NOT NULL,
	`cm_role` enum('owner','admin','staff','viewer') NOT NULL DEFAULT 'staff',
	`cm_joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sub_companyId` int NOT NULL,
	`sub_plan` enum('starter','professional','enterprise') NOT NULL DEFAULT 'professional',
	`sub_status` enum('trial','active','expired','cancelled') NOT NULL DEFAULT 'trial',
	`sub_trialStartDate` timestamp NOT NULL DEFAULT (now()),
	`sub_trialEndDate` timestamp NOT NULL,
	`sub_subscriptionStartDate` timestamp,
	`sub_subscriptionEndDate` timestamp,
	`sub_paymentGateway` varchar(50),
	`sub_paymentId` varchar(200),
	`sub_amount` decimal(10,2),
	`sub_currency` varchar(10) DEFAULT 'INR',
	`sub_autoRenew` boolean DEFAULT true,
	`sub_createdAt` timestamp NOT NULL DEFAULT (now()),
	`sub_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
