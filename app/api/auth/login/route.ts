import { createSessionCookie } from "../../../../lib/auth-session";
import { configuredPreviewAccounts } from "../../../../lib/auth-accounts";
import { getRuntimeEnv } from "../../../../lib/runtime";
import {
  isSupabaseConfigured,
  signInWithSupabase,
} from "../../../../lib/supabase-auth";

function constantTimeEqual(value: string, expected: string) {
  const length = Math.max(value.length, expected.length);
  let difference = value.length ^ expected.length;

  for (let index = 0; index < length; index += 1) {
    difference |=
      (value.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
  }

  return difference === 0;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    email?: string;
    password?: string;
  };
  const runtime = getRuntimeEnv() ?? {};
  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password ?? "";

  if (!email || !password) {
    return Response.json(
      { ok: false, error: "Enter your email and password." },
      { status: 400 },
    );
  }

  try {
    let account: { email: string; name: string } | undefined;
    if (isSupabaseConfigured()) {
      account = await signInWithSupabase(email, password);
    } else {
      const preview = configuredPreviewAccounts(runtime).find((candidate) =>
        constantTimeEqual(candidate.email, email),
      );
      if (!preview || !constantTimeEqual(preview.password, password)) {
        return Response.json(
          { ok: false, error: "Email or password is incorrect." },
          { status: 401 },
        );
      }
      account = { email: preview.email, name: preview.name };
    }

    const cookie = await createSessionCookie(
      account.email,
      request,
      account.name,
    );
    return Response.json(
      {
        ok: true,
        user: {
          email: account.email,
          name: account.name,
        },
      },
      { headers: { "set-cookie": cookie } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/invalid|credentials|password|email/i.test(message)) {
      return Response.json(
        { ok: false, error: "Email or password is incorrect." },
        { status: 401 },
      );
    }
    return Response.json(
      { ok: false, error: "Secure member access is temporarily unavailable." },
      { status: 503 },
    );
  }
}
