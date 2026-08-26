CREATE TABLE `invite_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code_hash` text NOT NULL,
	`email` text,
	`role` text DEFAULT 'member' NOT NULL,
	`comped` integer DEFAULT false NOT NULL,
	`max_uses` integer DEFAULT 1 NOT NULL,
	`uses` integer DEFAULT 0 NOT NULL,
	`expires_at` text,
	`redeemed_at` text,
	`redeemed_by` text,
	`created_by` text DEFAULT 'system' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invite_codes_code_hash_unique` ON `invite_codes` (`code_hash`);--> statement-breakpoint
CREATE INDEX `idx_invite_codes_email` ON `invite_codes` (`email`);--> statement-breakpoint
CREATE INDEX `idx_invite_codes_expiry` ON `invite_codes` (`expires_at`);--> statement-breakpoint
CREATE TABLE `member_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`password_iterations` integer NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`force_password_reset` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_accounts_email_unique` ON `member_accounts` (`email`);--> statement-breakpoint
CREATE INDEX `idx_member_accounts_status` ON `member_accounts` (`status`);--> statement-breakpoint
INSERT INTO `member_accounts`
  (`email`, `display_name`, `password_hash`, `password_salt`,
   `password_iterations`, `role`, `status`, `force_password_reset`,
   `created_at`, `updated_at`)
VALUES
('amechi@addcolormedia.com', 'Amechi', 'TK7kH55NGJ2nTmKn188Cn_3E_IAZA0Xub14peGfoqX4', '2LaRi_qN-mK8n7PybjIGTg', 100000, 'admin', 'active', 0, '2026-08-26T22:30:00.000Z', '2026-08-26T22:30:00.000Z'),
('shawndaniels2015@gmail.com', 'Shawn Daniels', 'f6Quzc3BZ0BRyuT47kLEuJzJn4HYK6JPDwoCeM3TtGA', 'uXBjW3DvyAtmJQb-cx1qfw', 100000, 'member', 'active', 0, '2026-08-26T22:30:00.000Z', '2026-08-26T22:30:00.000Z'),
('19keys@19keys.com', '19Keys', 'dECBprvYuBaldz0RiYUtxkLrr0A4bG4mGig4wd2YRQM', '25jbOYSgNS6EHJZP235d2w', 100000, 'member', 'active', 0, '2026-08-26T22:30:00.000Z', '2026-08-26T22:30:00.000Z');
