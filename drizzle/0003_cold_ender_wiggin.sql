CREATE TABLE `flashcardSets` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`sourceConversationId` varchar(64),
	`title` varchar(160) NOT NULL,
	`cardsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flashcardSets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `flashcards_user_project_updated_idx` ON `flashcardSets` (`userId`,`projectId`,`updatedAt`);