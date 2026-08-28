ALTER TABLE `client_profiles` ADD `birthday` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `client_profiles` ADD `member_status` text DEFAULT 'active' NOT NULL;
--> statement-breakpoint
ALTER TABLE `client_profiles` ADD `next_delivery` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `client_assets` ADD `board_title` text DEFAULT 'My Vision' NOT NULL;
--> statement-breakpoint
ALTER TABLE `client_assets` ADD `item_type` text DEFAULT 'Inspiration' NOT NULL;
--> statement-breakpoint
ALTER TABLE `client_assets` ADD `status` text DEFAULT 'idea' NOT NULL;
