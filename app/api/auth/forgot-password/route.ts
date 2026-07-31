import { requestSupabasePasswordReset } from "../../../../lib/supabase-auth";

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
    const sent = await requestSupabasePasswordReset(
      email,
      `${new URL(request.url).origin}/reset-password`,
    );
    return Response.json({
      ok: true,
      message: sent
        ? "Check your inbox for a secure password reset link."
        : "This preview account uses the temporary password supplied by the Able1Self team.",
    });
  } catch {
    // Keep the response generic so account existence cannot be enumerated.
    return Response.json({
      ok: true,
      message: "If that account exists, a secure reset link is on its way.",
    });
  }
}
