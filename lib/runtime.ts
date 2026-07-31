export type AbleRuntimeEnv = {
  DB?: D1Database;
  DEMO_LOGIN_EMAIL?: string;
  DEMO_LOGIN_PASSWORD?: string;
  AUTH_SESSION_SECRET?: string;
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
