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
('amechi@addcolormedia.com', 'Amechi', 'kvKKeMZ46lAE8ChSqO2-QwtqdbSxt7ogqtEnANJi3tk', '2LaRi_qN-mK8n7PybjIGTg', 210000, 'admin', 'active', 0, '2026-08-26T22:30:00.000Z', '2026-08-26T22:30:00.000Z'),
('shawndaniels2015@gmail.com', 'Shawn Daniels', 'BEI-Yph1hcj6H4uQUMAJ1_cuLYP_qzZRaOFuNBl1urg', 'uXBjW3DvyAtmJQb-cx1qfw', 210000, 'member', 'active', 0, '2026-08-26T22:30:00.000Z', '2026-08-26T22:30:00.000Z'),
('19keys@19keys.com', '19Keys', 'ss9ebKxHc4SBWt8HXQBODiBq3r75lTD-A84RoUzvQ_g', '25jbOYSgNS6EHJZP235d2w', 210000, 'member', 'active', 0, '2026-08-26T22:30:00.000Z', '2026-08-26T22:30:00.000Z');
