ALTER TABLE `action_plan_items` ADD `why` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `action_plan_items` ADD `success_metric` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `action_plan_items` ADD `start_date` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `action_plan_items` ADD `checkin_cadence` text DEFAULT 'weekly' NOT NULL;
--> statement-breakpoint
CREATE TABLE `plan_checkins` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `member_id` integer NOT NULL,
  `plan_item_id` integer NOT NULL,
  `checkpoint_date` text NOT NULL,
  `status` text NOT NULL,
  `explanation` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_plan_checkins_member_item` ON `plan_checkins` (`member_id`,`plan_item_id`,`checkpoint_date`);
