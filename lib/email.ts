import { getRuntimeEnv } from "./runtime";

type ResetEmailInput = {
  to: string;
  name: string;
  resetUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendPasswordResetEmail(input: ResetEmailInput) {
  const env = getRuntimeEnv();
  const apiKey = env?.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "missing_resend_key" as const };

  const from =
    env.PASSWORD_RESET_FROM?.trim() || "Able1Self <onboarding@resend.dev>";
  const safeName = escapeHtml(input.name || "there");
  const safeUrl = escapeHtml(input.resetUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: "Reset your Able1Self password",
      html: `<!doctype html><html><body style="margin:0;background:#f6f6f4;font-family:Arial,sans-serif;color:#1d1d1f"><main style="max-width:560px;margin:auto;padding:48px 24px"><p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#5f666a">ABLE1SELF</p><h1 style="font-size:28px;line-height:1.2;margin:0 0 16px">Reset your password.</h1><p style="font-size:16px;line-height:1.6">Hi ${safeName}, use the secure link below to choose a new password. This link expires in one hour.</p><p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;border-radius:999px;padding:14px 22px;font-weight:700">Choose new password</a></p><p style="font-size:13px;line-height:1.6;color:#60666a">If you did not request this, you can ignore this email.</p></main></body></html>`,
      text: `Hi ${input.name || "there"}, reset your Able1Self password here: ${input.resetUrl}\n\nThis link expires in one hour.`,
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "Unable to send reset email.");
  }

  return { sent: true as const };
}
