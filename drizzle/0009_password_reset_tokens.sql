CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL,
  `token_hash` text NOT NULL,
  `expires_at` text NOT NULL,
  `used_at` text,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `password_reset_tokens_token_hash_unique` ON `password_reset_tokens` (`token_hash`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_password_reset_tokens_email` ON `password_reset_tokens` (`email`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_password_reset_tokens_expiry` ON `password_reset_tokens` (`expires_at`);
