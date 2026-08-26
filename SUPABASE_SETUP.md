# Able1Self production member access

Able1Self member authentication is owned by Cloudflare D1. Account records use
unique salted PBKDF2 password hashes, and the member portal checks the account's
active status whenever it validates a session.

## Production configuration

The deployment must provide:

- the existing `DB` D1 binding;
- an `AUTH_SESSION_SECRET` value with at least 32 random characters.

Do not configure preview-account or shared-password environment variables.
Supabase environment values may remain available for legacy recovery routes,
but they do not grant member access.

## Account creation

Public account creation is disabled. A new member must submit a valid invite
code, and each invite can be restricted by email, role, expiration date, and
maximum use count. Invite codes are stored only as SHA-256 digests.

Create invite records administratively. Never put a plaintext invite code in a
migration, source file, or production log.

## Seeded members

The checked-in migrations provision these existing members with separate
temporary passwords:

- `amechi@addcolormedia.com`
- `shawndaniels2015@gmail.com`
- `19keys@19keys.com`

Only password hashes and salts are committed. Share each temporary password
privately with its intended member.

## Launch checks

1. Confirm each seeded member can sign in with only their own password.
2. Confirm an arbitrary email and a former shared password are rejected.
3. Confirm an uninvited account cannot be created.
4. Redeem a one-use invite and confirm it cannot be redeemed again.
5. Sign in, answer one question, sign out, and confirm the answer persists.
6. Confirm one member cannot see another member's profile or progress.
