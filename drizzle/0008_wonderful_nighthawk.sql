CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`feedbackType` enum('general','sprint_plan') NOT NULL DEFAULT 'general',
	`category` enum('bug','feature_request','content','ux','other') NOT NULL DEFAULT 'other',
	`message` text NOT NULL,
	`page` varchar(64),
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sprint_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`planId` varchar(64) NOT NULL,
	`targetLevel` varchar(8),
	`timeline` varchar(32),
	`planData` json NOT NULL,
	`shareToken` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sprint_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `sprint_plans_planId_unique` UNIQUE(`planId`),
	CONSTRAINT `sprint_plans_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
CREATE TABLE `user_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patternRatings` json NOT NULL DEFAULT ('{}'),
	`behavioralRatings` json NOT NULL DEFAULT ('{}'),
	`starNotes` json NOT NULL DEFAULT ('{}'),
	`patternTime` json NOT NULL DEFAULT ('{}'),
	`interviewDate` varchar(16),
	`targetLevel` varchar(8),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_scores_userId_unique` UNIQUE(`userId`)
);
