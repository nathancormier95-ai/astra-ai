ALTER TABLE `workspacePreferences` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `workspacePreferences` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `workspacePreferences` ADD `subscriptionStatus` varchar(40);--> statement-breakpoint
ALTER TABLE `workspacePreferences` ADD `premiumCurrentPeriodEnd` timestamp;