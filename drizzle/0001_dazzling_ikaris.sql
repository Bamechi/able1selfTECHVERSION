CREATE TABLE `guide_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`role` text NOT NULL,
	`body` text NOT NULL,
	`grounded_on_engine_version` text DEFAULT '2.0' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_guide_messages_member_created` ON `guide_messages` (`member_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `identity_results` (
	`member_id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`archetype_name` text NOT NULL,
	`provisional` integer DEFAULT true NOT NULL,
	`confidence` integer DEFAULT 0 NOT NULL,
	`axes_json` text DEFAULT '[]' NOT NULL,
	`style_archetype` text DEFAULT '' NOT NULL,
	`palette_json` text DEFAULT '{}' NOT NULL,
	`energy_json` text DEFAULT '{}' NOT NULL,
	`income_streams_json` text DEFAULT '[]' NOT NULL,
	`brand_statement` text DEFAULT '' NOT NULL,
	`engine_version` text DEFAULT '2.0' NOT NULL,
	`computed_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `member_birth_data` (
	`member_id` integer PRIMARY KEY NOT NULL,
	`full_birth_name` text DEFAULT '' NOT NULL,
	`birth_date` text DEFAULT '' NOT NULL,
	`birth_time` text DEFAULT '' NOT NULL,
	`birth_city` text DEFAULT '' NOT NULL,
	`sun_sign` text DEFAULT '' NOT NULL,
	`moon_sign` text DEFAULT '' NOT NULL,
	`rising_sign` text DEFAULT '' NOT NULL,
	`ephemeris_status` text DEFAULT 'pending' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nudge_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`nudge_type` text NOT NULL,
	`channel` text NOT NULL,
	`sent_at` text NOT NULL,
	`opened_at` text,
	`converted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_nudge_log_member_sent` ON `nudge_log` (`member_id`,`sent_at`);--> statement-breakpoint
CREATE TABLE `partner_matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`candidate_id` integer NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`reason_json` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'suggested' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_partner_matches_pair` ON `partner_matches` (`member_id`,`candidate_id`);--> statement-breakpoint
CREATE INDEX `idx_partner_matches_member_score` ON `partner_matches` (`member_id`,`score`);--> statement-breakpoint
CREATE TABLE `profile_sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`section_key` text NOT NULL,
	`module_key` text NOT NULL,
	`stage` text NOT NULL,
	`title` text NOT NULL,
	`locked` integer DEFAULT true NOT NULL,
	`content_json` text DEFAULT '{}' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profile_sections_member_section` ON `profile_sections` (`member_id`,`section_key`);--> statement-breakpoint
CREATE TABLE `profile_synthesis` (
	`member_id` integer PRIMARY KEY NOT NULL,
	`narrative` text DEFAULT '' NOT NULL,
	`review_status` text DEFAULT 'ai_generated' NOT NULL,
	`reviewed_by` text DEFAULT '' NOT NULL,
	`reviewed_at` text,
	`share_enabled` integer DEFAULT false NOT NULL,
	`share_token` text DEFAULT '' NOT NULL,
	`generated_at` text NOT NULL
);
