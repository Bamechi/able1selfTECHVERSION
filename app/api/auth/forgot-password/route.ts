import { createPasswordResetToken } from "../../../../lib/account-store";
import { sendPasswordResetEmail } from "../../../../lib/email";
import { getRuntimeEnv } from "../../../../lib/runtime";

export async function POST(request: Request) {
  const payload = (await request.json()) as { email?: string };
  const email = payload.email?.trim() ?? "";

  if (!email || !email.includes("@")) {
    return Response.json(
      { ok: false, error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    const reset = await createPasswordResetToken(email);
    if (reset) {
      const origin =
        getRuntimeEnv()?.APP_ORIGIN?.trim() || new URL(request.url).origin;
      await sendPasswordResetEmail({
        to: reset.email,
        name: reset.name,
        resetUrl: `${origin}/reset-password#access_token=${encodeURIComponent(reset.token)}`,
      });
    }
  } catch {
    return Response.json(
      { ok: false, error: "Unable to send reset instructions right now." },
      { status: 503 },
    );
  }

  return Response.json({
    ok: true,
    message: "If that account exists, secure reset instructions will be sent.",
  });
}
