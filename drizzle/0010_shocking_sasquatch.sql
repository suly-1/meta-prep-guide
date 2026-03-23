CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int,
	`eventName` varchar(128) NOT NULL,
	`page` varchar(128),
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_page_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int,
	`page` varchar(128) NOT NULL,
	`referrer` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_page_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int,
	`deviceType` enum('desktop','tablet','mobile') DEFAULT 'desktop',
	`browser` varchar(64),
	`os` varchar(64),
	`country` varchar(64),
	`durationSeconds` int DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	CONSTRAINT `analytics_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `analytics_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
