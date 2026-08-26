// Cloudflare Workers rejects PBKDF2 work factors above 100,000.
const PASSWORD_ITERATIONS = 100_000;

function encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function decode(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function equalBytes(value: Uint8Array, expected: Uint8Array) {
  const length = Math.max(value.length, expected.length);
  let difference = value.length ^ expected.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (value[index] || 0) ^ (expected[index] || 0);
  }
  return difference === 0;
}

async function derivePassword(
  password: string,
  salt: Uint8Array,
  iterations: number,
) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return {
    hash: encode(await derivePassword(password, salt, PASSWORD_ITERATIONS)),
    salt: encode(salt),
    iterations: PASSWORD_ITERATIONS,
  };
}

export async function verifyPassword(
  password: string,
  expectedHash: string,
  salt: string,
  iterations: number,
) {
  if (!password || iterations < 100_000) return false;
  const derived = await derivePassword(password, decode(salt), iterations);
  return equalBytes(derived, decode(expectedHash));
}

export async function digestInviteCode(code: string) {
  const normalized = code.trim().toUpperCase();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalized),
  );
  return encode(new Uint8Array(digest));
}
