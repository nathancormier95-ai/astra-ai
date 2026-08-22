CREATE TABLE `projects` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`color` varchar(16) NOT NULL DEFAULT 'violet',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedConversations` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`projectId` varchar(64),
	`title` varchar(160) NOT NULL,
	`modeId` varchar(48) NOT NULL DEFAULT 'general',
	`modelId` varchar(120) NOT NULL DEFAULT 'gpt-5-mini',
	`messagesJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uploadedDocuments` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`projectId` varchar(64),
	`name` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`byteSize` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uploadedDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usageEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` enum('chat','image','document','voice') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usageEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspacePreferences` (
	`userId` int NOT NULL,
	`plan` enum('free','premium') NOT NULL DEFAULT 'free',
	`retention` enum('until_deleted') NOT NULL DEFAULT 'until_deleted',
	`allowAiTraining` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspacePreferences_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE INDEX `projects_user_updated_idx` ON `projects` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `conversations_user_updated_idx` ON `savedConversations` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `documents_user_created_idx` ON `uploadedDocuments` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `usage_user_action_created_idx` ON `usageEvents` (`userId`,`action`,`createdAt`);