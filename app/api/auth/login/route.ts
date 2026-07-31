import { createSessionCookie } from "../../../../lib/auth-session";
import { getRuntimeEnv } from "../../../../lib/runtime";

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
  const expectedEmail = runtime.DEMO_LOGIN_EMAIL?.trim().toLowerCase();
  const expectedPassword = runtime.DEMO_LOGIN_PASSWORD ?? "";
  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password ?? "";

  if (!expectedEmail || !expectedPassword) {
    return Response.json(
      { ok: false, error: "The preview account is not configured." },
      { status: 503 },
    );
  }

  if (
    !constantTimeEqual(email, expectedEmail) ||
    !constantTimeEqual(password, expectedPassword)
  ) {
    return Response.json(
      { ok: false, error: "Email or password is incorrect." },
      { status: 401 },
    );
  }

  try {
    const cookie = await createSessionCookie(email, request);
    return Response.json(
      {
        ok: true,
        user: {
          email,
          name: "Amechi",
        },
      },
      { headers: { "set-cookie": cookie } },
    );
  } catch {
    return Response.json(
      { ok: false, error: "Secure member sessions are not configured." },
      { status: 503 },
    );
  }
}
