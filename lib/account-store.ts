import { displayNameFromEmail } from "./auth-accounts";
import {
  digestInviteCode,
  digestResetToken,
  generateResetToken,
  hashPassword,
  verifyPassword,
} from "./password-auth";
import { getD1 } from "./runtime";

export type MemberRole = "member" | "admin";

type AccountRow = {
  email: string;
  display_name: string;
  password_hash: string;
  password_salt: string;
  password_iterations: number;
  role: MemberRole;
  status: string;
  force_password_reset: number;
};

type InviteRow = {
  id: number;
  email: string | null;
  role: MemberRole;
  max_uses: number;
  uses: number;
  expires_at: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isCompedTesterEmail(email: string) {
  return ["amechi@addcolormedia.com", "shawndaniels2015@gmail.com"].includes(
    normalizeEmail(email),
  );
}

export async function activeAccountForEmail(email: string) {
  const account = await getD1()
    .prepare(
      `SELECT email, display_name, password_hash, password_salt,
              password_iterations, role, status, force_password_reset
       FROM member_accounts WHERE email = ? AND status = 'active'`,
    )
    .bind(normalizeEmail(email))
    .first<AccountRow>();
  return account ?? null;
}

export async function authenticateMember(email: string, password: string) {
  const account = await activeAccountForEmail(email);
  if (
    !account ||
    !(await verifyPassword(
      password,
      account.password_hash,
      account.password_salt,
      account.password_iterations,
    ))
  ) {
    return null;
  }
  return {
    email: account.email,
    name: account.display_name,
    role: account.role,
    forcePasswordReset: Boolean(account.force_password_reset),
  };
}

export async function redeemInvite(input: {
  code: string;
  email: string;
  name: string;
  password: string;
}) {
  const db = getD1();
  const email = normalizeEmail(input.email);
  const codeHash = await digestInviteCode(input.code);
  const invite = await db
    .prepare(
      `SELECT id, email, role, max_uses, uses, expires_at
       FROM invite_codes WHERE code_hash = ?`,
    )
    .bind(codeHash)
    .first<InviteRow>();
  const now = new Date();
  if (
    !invite ||
    invite.uses >= invite.max_uses ||
    (invite.email && normalizeEmail(invite.email) !== email) ||
    (invite.expires_at && new Date(invite.expires_at) <= now)
  ) {
    throw new Error("This invite code is invalid or has expired.");
  }

  const existing = await activeAccountForEmail(email);
  if (existing) throw new Error("An account already exists for this email.");

  const passwordRecord = await hashPassword(input.password);
  const timestamp = now.toISOString();
  const name = input.name.trim() || displayNameFromEmail(email);
  await db.batch([
    db
      .prepare(
        `INSERT INTO member_accounts
         (email, display_name, password_hash, password_salt,
          password_iterations, role, status, force_password_reset,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', 0, ?, ?)`,
      )
      .bind(
        email,
        name,
        passwordRecord.hash,
        passwordRecord.salt,
        passwordRecord.iterations,
        invite.role,
        timestamp,
        timestamp,
      ),
    db
      .prepare(
        `INSERT OR IGNORE INTO member_profiles
         (email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?)`,
      )
      .bind(email, name, timestamp, timestamp),
    db
      .prepare(
        `UPDATE invite_codes
         SET uses = uses + 1, redeemed_at = ?, redeemed_by = ?
         WHERE id = ? AND uses < max_uses`,
      )
      .bind(timestamp, email, invite.id),
  ]);

  return { email, name, role: invite.role };
}

export async function createPasswordResetToken(emailInput: string) {
  const account = await activeAccountForEmail(emailInput);
  if (!account) return null;

  const email = normalizeEmail(account.email);
  const token = generateResetToken();
  const tokenHash = await digestResetToken(token);
  const now = new Date();
  const timestamp = now.toISOString();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60).toISOString();
  const db = getD1();

  await db.batch([
    db
      .prepare(
        `UPDATE password_reset_tokens
         SET used_at = ?
         WHERE email = ? AND used_at IS NULL`,
      )
      .bind(timestamp, email),
    db
      .prepare(
        `INSERT INTO password_reset_tokens
         (email, token_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(email, tokenHash, expiresAt, timestamp),
  ]);

  return { email, name: account.display_name, token, expiresAt };
}

export async function resetPasswordWithToken(token: string, password: string) {
  const tokenHash = await digestResetToken(token);
  const now = new Date().toISOString();
  const db = getD1();
  const row = await db
    .prepare(
      `SELECT email
       FROM password_reset_tokens
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`,
    )
    .bind(tokenHash, now)
    .first<{ email: string }>();

  if (!row) throw new Error("This password reset link is invalid or expired.");

  const account = await activeAccountForEmail(row.email);
  if (!account) throw new Error("This password reset link is invalid or expired.");

  const passwordRecord = await hashPassword(password);
  const timestamp = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `UPDATE member_accounts
         SET password_hash = ?,
             password_salt = ?,
             password_iterations = ?,
             force_password_reset = 0,
             updated_at = ?
         WHERE email = ? AND status = 'active'`,
      )
      .bind(
        passwordRecord.hash,
        passwordRecord.salt,
        passwordRecord.iterations,
        timestamp,
        normalizeEmail(row.email),
      ),
    db
      .prepare(
        `UPDATE password_reset_tokens
         SET used_at = ?
         WHERE token_hash = ?`,
      )
      .bind(timestamp, tokenHash),
  ]);

  return {
    email: account.email,
    name: account.display_name,
    role: account.role,
  };
}
