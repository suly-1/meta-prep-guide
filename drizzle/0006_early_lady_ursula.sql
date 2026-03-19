CREATE TABLE `ctci_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`solved` json NOT NULL,
	`difficulty` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ctci_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `ctci_progress_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `mock_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionType` varchar(32) NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`sessionData` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mock_sessions_id` PRIMARY KEY(`id`)
);
