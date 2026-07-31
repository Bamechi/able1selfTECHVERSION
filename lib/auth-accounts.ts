import type { AbleRuntimeEnv } from "./runtime";

export type AbleAccount = {
  email: string;
  password: string;
  name: string;
};

export function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "Member";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\d+$/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Member";
}

export function configuredPreviewAccounts(runtime: AbleRuntimeEnv = {}) {
  const accounts: AbleAccount[] = [];

  if (runtime.PREVIEW_ACCOUNTS_JSON) {
    try {
      const parsed = JSON.parse(runtime.PREVIEW_ACCOUNTS_JSON) as Array<
        Partial<AbleAccount>
      >;
      for (const account of parsed) {
        const email = account.email?.trim().toLowerCase() ?? "";
        const password = account.password ?? "";
        if (!email || !password) continue;
        accounts.push({
          email,
          password,
          name: account.name?.trim() || displayNameFromEmail(email),
        });
      }
    } catch {
      // The legacy single-account variables below remain a safe fallback.
    }
  }

  const legacyEmail = runtime.DEMO_LOGIN_EMAIL?.trim().toLowerCase();
  const legacyPassword = runtime.DEMO_LOGIN_PASSWORD ?? "";
  if (legacyEmail && legacyPassword) {
    accounts.push({
      email: legacyEmail,
      password: legacyPassword,
      name: legacyEmail === "amechi@addcolormedia.com"
        ? "Amechi"
        : displayNameFromEmail(legacyEmail),
    });
  }

  return [...new Map(accounts.map((account) => [account.email, account])).values()];
}

export function previewAccountForEmail(runtime: AbleRuntimeEnv, email: string) {
  const normalized = email.trim().toLowerCase();
  return configuredPreviewAccounts(runtime).find(
    (account) => account.email === normalized,
  );
}
