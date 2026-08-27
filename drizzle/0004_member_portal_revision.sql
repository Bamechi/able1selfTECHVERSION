ALTER TABLE `member_birth_data` ADD `birth_state` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `member_birth_data` ADD `birth_country` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `member_birth_data` ADD `latitude` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `member_birth_data` ADD `longitude` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `member_birth_data` ADD `timezone` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `member_birth_data` ADD `chart_json` text DEFAULT '{}' NOT NULL;
--> statement-breakpoint
CREATE TABLE `legacy_response_archive` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `member_id` integer NOT NULL,
  `module_key` text NOT NULL,
  `question_key` text NOT NULL,
  `answer` text NOT NULL,
  `archived_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `legacy_response_archive` (`member_id`, `module_key`, `question_key`, `answer`, `archived_at`)
SELECT `member_id`, `module_key`, `question_key`, `answer`, '2026-08-27T02:00:00.000Z'
FROM `survey_responses` WHERE `question_key` = 'a2_element';
--> statement-breakpoint
DELETE FROM `survey_responses` WHERE `question_key` = 'a2_element';
--> statement-breakpoint
CREATE TABLE `client_profiles` (
  `member_id` integer PRIMARY KEY NOT NULL,
  `phone` text DEFAULT '' NOT NULL,
  `preferred_name` text DEFAULT '' NOT NULL,
  `shipping_address` text DEFAULT '' NOT NULL,
  `calendly_url` text DEFAULT '' NOT NULL,
  `stylist_notes` text DEFAULT '' NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `measurement_sets` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `member_id` integer NOT NULL,
  `label` text DEFAULT 'Current' NOT NULL,
  `measured_at` text DEFAULT '' NOT NULL,
  `measured_by` text DEFAULT '' NOT NULL,
  `unit` text DEFAULT 'in' NOT NULL,
  `notes` text DEFAULT '' NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_measurement_sets_member` ON `measurement_sets` (`member_id`,`updated_at`);
--> statement-breakpoint
CREATE TABLE `measurements` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `set_id` integer NOT NULL,
  `measurement_key` text NOT NULL,
  `value` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_measurements_set_key` ON `measurements` (`set_id`,`measurement_key`);
--> statement-breakpoint
CREATE TABLE `client_assets` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `member_id` integer NOT NULL,
  `category` text NOT NULL,
  `object_key` text NOT NULL,
  `filename` text NOT NULL,
  `content_type` text NOT NULL,
  `size` integer DEFAULT 0 NOT NULL,
  `caption` text DEFAULT '' NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `client_assets_object_key_unique` ON `client_assets` (`object_key`);
--> statement-breakpoint
CREATE INDEX `idx_client_assets_member` ON `client_assets` (`member_id`,`category`);
--> statement-breakpoint
CREATE TABLE `appointments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `member_id` integer NOT NULL,
  `title` text NOT NULL,
  `starts_at` text NOT NULL,
  `status` text DEFAULT 'scheduled' NOT NULL,
  `notes` text DEFAULT '' NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_appointments_member` ON `appointments` (`member_id`,`starts_at`);
--> statement-breakpoint
CREATE TABLE `client_orders` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `member_id` integer NOT NULL,
  `order_number` text NOT NULL,
  `title` text NOT NULL,
  `status` text DEFAULT 'planning' NOT NULL,
  `amount` text DEFAULT '' NOT NULL,
  `tracking_url` text DEFAULT '' NOT NULL,
  `notes` text DEFAULT '' NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_client_orders_member` ON `client_orders` (`member_id`,`updated_at`);
--> statement-breakpoint
CREATE TABLE `admin_audit_log` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `actor_email` text NOT NULL,
  `member_id` integer NOT NULL,
  `action` text NOT NULL,
  `detail_json` text DEFAULT '{}' NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_admin_audit_member` ON `admin_audit_log` (`member_id`,`created_at`);
--> statement-breakpoint
UPDATE `member_accounts` SET
  `password_hash` = 'fyeo8Y7RQwdjBS3wEn1-lXmL5cv4ng6hGJmioPAm4wk',
  `password_iterations` = 100000,
  `force_password_reset` = 0,
  `updated_at` = '2026-08-27T02:00:00.000Z'
WHERE `email` = 'amechi@addcolormedia.com';
--> statement-breakpoint
UPDATE `member_accounts` SET
  `password_hash` = '5074n6tTceafHx-nG0Ah6qMo8MKXhrqgyxeNFpxgBJI',
  `password_iterations` = 100000,
  `role` = 'admin',
  `force_password_reset` = 0,
  `updated_at` = '2026-08-27T02:00:00.000Z'
WHERE `email` = 'shawndaniels2015@gmail.com';
--> statement-breakpoint
UPDATE `member_accounts` SET
  `password_hash` = 'x-Xv3x588AC-0Z2cMqfo-bhqO-BvdbppPpqbMe6tAsQ',
  `password_iterations` = 100000,
  `role` = 'member',
  `force_password_reset` = 0,
  `updated_at` = '2026-08-27T02:00:00.000Z'
WHERE `email` = '19keys@19keys.com';
