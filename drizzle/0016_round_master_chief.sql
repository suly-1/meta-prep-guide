CREATE TABLE `user_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int NOT NULL,
	`actorName` varchar(128),
	`targetId` int NOT NULL,
	`targetName` varchar(128),
	`eventType` varchar(32) NOT NULL,
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `blockReason` text;