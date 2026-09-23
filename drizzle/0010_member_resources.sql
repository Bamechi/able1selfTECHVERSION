CREATE TABLE IF NOT EXISTS member_resources (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  member_id integer NOT NULL,
  resource_type text NOT NULL,
  title text NOT NULL,
  organization text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  engagement text NOT NULL DEFAULT '',
  compensation text NOT NULL DEFAULT '',
  summary text NOT NULL,
  contact text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  created_at text NOT NULL,
  updated_at text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_member_resources_status_created ON member_resources(status, created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_member_resources_member ON member_resources(member_id, created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS resource_captures (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  resource_id integer NOT NULL,
  member_id integer NOT NULL,
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'saved',
  created_at text NOT NULL,
  updated_at text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_resource_captures_unique ON resource_captures(resource_id, member_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_resource_captures_member ON resource_captures(member_id, updated_at);
