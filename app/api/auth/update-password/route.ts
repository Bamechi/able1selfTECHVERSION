import { createSessionCookie } from "../../../../lib/auth-session";
import { updateSupabasePassword } from "../../../../lib/supabase-auth";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    accessToken?: string;
    password?: string;
  };
  if (!payload.accessToken) {
    return Response.json(
      { ok: false, error: "The password reset link is incomplete." },
      { status: 400 },
    );
  }
  if (!payload.password || payload.password.length < 8) {
    return Response.json(
      { ok: false, error: "Use a new password with at least 8 characters." },
      { status: 400 },
    );
  }
  try {
    const account = await updateSupabasePassword(
      payload.accessToken,
      payload.password,
    );
    const cookie = await createSessionCookie(
      account.email,
      request,
      account.name,
    );
    return Response.json(
      { ok: true, user: account },
      { headers: { "set-cookie": cookie } },
    );
  } catch {
    return Response.json(
      { ok: false, error: "This password reset link is invalid or expired." },
      { status: 401 },
    );
  }
}

