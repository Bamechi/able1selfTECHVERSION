import { getRuntimeEnv } from "./runtime";
import { displayNameFromEmail, previewAccountForEmail } from "./auth-accounts";
import { isSupabaseConfigured } from "./supabase-auth";

const COOKIE_NAME = "able1self_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  email: string;
  name?: string;
  expiresAt: number;
};

function encode(value: string) {
  return btoa(value)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function decode(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  return atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
}

async function signature(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return encode(String.fromCharCode(...new Uint8Array(signed)));
}

function constantTimeEqual(value: string, expected: string) {
  const length = Math.max(value.length, expected.length);
  let difference = value.length ^ expected.length;
  for (let index = 0; index < length; index += 1) {
    difference |=
      (value.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
  }
  return difference === 0;
}

export async function createSessionCookie(
  email: string,
  request: Request,
  name?: string,
) {
  const secret = getRuntimeEnv()?.AUTH_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("The session secret is not configured securely.");
  }
  const payload: SessionPayload = {
    email,
    name: name?.trim() || displayNameFromEmail(email),
    expiresAt: Date.now() + SESSION_SECONDS * 1000,
  };
  const encoded = encode(JSON.stringify(payload));
  const token = `${encoded}.${await signature(encoded, secret)}`;
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function clearSessionCookie(request: Request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

function readCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie") ?? "";
  for (const item of cookies.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return parts.join("=");
  }
  return "";
}

export async function getSession(request: Request) {
  const runtime = getRuntimeEnv();
  const secret = runtime?.AUTH_SESSION_SECRET;
  const token = readCookie(request, COOKIE_NAME);
  if (!runtime || !secret || !token) return null;

  const [encoded, suppliedSignature] = token.split(".");
  if (!encoded || !suppliedSignature) return null;
  const expectedSignature = await signature(encoded, secret);
  if (!constantTimeEqual(suppliedSignature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(decode(encoded)) as SessionPayload;
    const email = payload.email.trim().toLowerCase();
    const previewAccount = previewAccountForEmail(runtime, email);
    if (
      payload.expiresAt < Date.now() ||
      (!isSupabaseConfigured() && !previewAccount)
    ) {
      return null;
    }
    return {
      email,
      name:
        payload.name?.trim() ||
        previewAccount?.name ||
        displayNameFromEmail(email),
    };
  } catch {
    return null;
  }
}

export async function requireSession(request: Request) {
  const session = await getSession(request);
  if (!session) {
    throw new Response(
      JSON.stringify({ ok: false, error: "Authentication required." }),
      {
        status: 401,
        headers: { "content-type": "application/json" },
      },
    );
  }
  return session;
}
