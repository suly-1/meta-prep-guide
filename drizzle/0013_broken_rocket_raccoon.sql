CREATE TABLE `favorite_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` varchar(128) NOT NULL,
	`questionType` enum('coding','behavioral','design','ctci') NOT NULL DEFAULT 'coding',
	`questionText` text NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorite_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `progress_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`snapshotDate` varchar(16) NOT NULL,
	`codingPct` int NOT NULL DEFAULT 0,
	`behavioralPct` int NOT NULL DEFAULT 0,
	`overallPct` int NOT NULL DEFAULT 0,
	`streakDays` int NOT NULL DEFAULT 0,
	`mockSessionCount` int NOT NULL DEFAULT 0,
	`patternsMastered` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `progress_snapshots_id` PRIMARY KEY(`id`)
);
