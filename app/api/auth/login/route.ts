import { createSessionCookie } from "../../../../lib/auth-session";
import { authenticateMember } from "../../../../lib/account-store";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    email?: string;
    password?: string;
  };
  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password ?? "";

  if (!email || !password) {
    return Response.json(
      { ok: false, error: "Enter your email and password." },
      { status: 400 },
    );
  }

  try {
    const account = await authenticateMember(email, password);
    if (!account) {
      return Response.json(
        { ok: false, error: "Email or password is incorrect." },
        { status: 401 },
      );
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
          role: account.role,
          forcePasswordReset: account.forcePasswordReset,
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
