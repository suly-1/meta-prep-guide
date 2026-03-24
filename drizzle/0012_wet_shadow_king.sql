CREATE TABLE `apex_picks_sets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekLabel` varchar(64) NOT NULL,
	`picks` json NOT NULL,
	`isActive` int NOT NULL DEFAULT 0,
	`weekIndex` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apex_picks_sets_id` PRIMARY KEY(`id`)
);
