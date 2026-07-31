import { createSessionCookie } from "../../../../lib/auth-session";
import { signUpWithSupabase } from "../../../../lib/supabase-auth";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    email?: string;
    password?: string;
    name?: string;
  };
  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password ?? "";
  const name = payload.name?.trim() ?? "";

  if (!email || !email.includes("@") || !name) {
    return Response.json(
      { ok: false, error: "Enter your name and a valid email address." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return Response.json(
      { ok: false, error: "Create a password with at least 8 characters." },
      { status: 400 },
    );
  }

  try {
    const account = await signUpWithSupabase({
      email,
      password,
      name,
      redirectTo: `${new URL(request.url).origin}/auth/complete`,
    });
    if (!account.emailConfirmed) {
      return Response.json({
        ok: true,
        authenticated: false,
        message: "Check your inbox to confirm your email, then your portal will open.",
      });
    }
    const cookie = await createSessionCookie(
      account.email,
      request,
      account.name,
    );
    return Response.json(
      { ok: true, authenticated: true, user: account },
      { headers: { "set-cookie": cookie } },
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create your account right now.",
      },
      { status: 400 },
    );
  }
}

