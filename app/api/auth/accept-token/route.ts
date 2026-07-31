import { createSessionCookie } from "../../../../lib/auth-session";
import { verifySupabaseAccessToken } from "../../../../lib/supabase-auth";

export async function POST(request: Request) {
  const payload = (await request.json()) as { accessToken?: string };
  if (!payload.accessToken) {
    return Response.json(
      { ok: false, error: "The confirmation link is incomplete." },
      { status: 400 },
    );
  }
  try {
    const account = await verifySupabaseAccessToken(payload.accessToken);
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
      { ok: false, error: "This confirmation link is invalid or expired." },
      { status: 401 },
    );
  }
}

