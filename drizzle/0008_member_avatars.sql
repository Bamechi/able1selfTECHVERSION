CREATE TABLE IF NOT EXISTS member_avatars (
  member_id integer PRIMARY KEY NOT NULL,
  object_key text NOT NULL,
  updated_at text NOT NULL
);
