import { createSessionCookie } from "../../../../lib/auth-session";
import { redeemInvite } from "../../../../lib/account-store";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    email?: string;
    password?: string;
    name?: string;
    inviteCode?: string;
  };
  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password ?? "";
  const name = payload.name?.trim() ?? "";
  const inviteCode = payload.inviteCode?.trim() ?? "";

  if (!email || !email.includes("@") || !name || !inviteCode) {
    return Response.json(
      { ok: false, error: "A valid invite code, name, and email are required." },
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
    const account = await redeemInvite({
      code: inviteCode,
      email,
      password,
      name,
    });
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
            : "Unable to redeem this invite right now.",
      },
      { status: 400 },
    );
  }
}
