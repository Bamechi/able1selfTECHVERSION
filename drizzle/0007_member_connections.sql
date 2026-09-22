CREATE TABLE IF NOT EXISTS community_members (
  member_id integer PRIMARY KEY NOT NULL,
  display_name text NOT NULL,
  headline text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  joined_at text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS club_posts (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  member_id integer NOT NULL,
  body text NOT NULL,
  created_at text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_club_posts_created ON club_posts(created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS direct_messages (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  sender_id integer NOT NULL,
  recipient_id integer NOT NULL,
  body text NOT NULL,
  created_at text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_direct_messages_participants ON direct_messages(sender_id,recipient_id,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS target_plan_generations (
  member_id integer PRIMARY KEY NOT NULL,
  created_at text NOT NULL
);
