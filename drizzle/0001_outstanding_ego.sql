CREATE TABLE `alertRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ruleName` varchar(255) NOT NULL,
	`triggerType` enum('new_device','risk_threshold','bandwidth_threshold','device_offline','suspicious_pattern') NOT NULL,
	`threshold` int,
	`notificationMethod` enum('email','in_app','both') NOT NULL DEFAULT 'both',
	`isEnabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deviceHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`userId` int NOT NULL,
	`eventType` enum('connected','disconnected','blocked','unblocked','risk_updated') NOT NULL,
	`riskScore` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deviceHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`macAddress` varchar(17) NOT NULL,
	`vendor` varchar(255),
	`deviceType` varchar(100),
	`deviceName` varchar(255),
	`isOnline` int NOT NULL DEFAULT 1,
	`isBlocked` int NOT NULL DEFAULT 0,
	`riskScore` int NOT NULL DEFAULT 0,
	`riskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
	`lastSeen` timestamp NOT NULL DEFAULT (now()),
	`firstSeen` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `devices_macAddress_unique` UNIQUE(`macAddress`)
);
--> statement-breakpoint
CREATE TABLE `networkTraffic` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deviceId` int,
	`uploadBytesPerSecond` int NOT NULL DEFAULT 0,
	`downloadBytesPerSecond` int NOT NULL DEFAULT 0,
	`totalUploadBytes` int NOT NULL DEFAULT 0,
	`totalDownloadBytes` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `networkTraffic_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `routerSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`routerIp` varchar(45) NOT NULL,
	`routerUsername` varchar(255),
	`routerPasswordEncrypted` text,
	`routerModel` varchar(255),
	`scanInterval` int NOT NULL DEFAULT 300,
	`isEnabled` int NOT NULL DEFAULT 1,
	`lastScanTime` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `routerSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `routerSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `securityAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deviceId` int,
	`alertType` enum('new_device','high_risk_device','suspicious_activity','device_blocked','anomaly_detected','bandwidth_spike','unauthorized_access') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`title` varchar(255) NOT NULL,
	`description` text,
	`isResolved` int NOT NULL DEFAULT 0,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `securityAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityRecommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deviceId` int,
	`recommendationType` enum('block_device','monitor_closely','update_firmware','change_password','isolate_device','investigate_behavior','enable_firewall') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`isImplemented` int NOT NULL DEFAULT 0,
	`implementedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `securityRecommendations_id` PRIMARY KEY(`id`)
);
