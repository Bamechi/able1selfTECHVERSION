export type AbleRuntimeEnv = {
  DB?: D1Database;
  AUTH_SESSION_SECRET?: string;
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
};

export function getRuntimeEnv() {
  return (
    globalThis as typeof globalThis & {
      __ABLE1SELF_RUNTIME_ENV__?: AbleRuntimeEnv;
    }
  ).__ABLE1SELF_RUNTIME_ENV__;
}

export function getD1() {
  const database = getRuntimeEnv()?.DB;
  if (!database) {
    throw new Error(
      "The Able1Self member database is unavailable. Confirm the DB binding is configured.",
    );
  }
  return database;
}
