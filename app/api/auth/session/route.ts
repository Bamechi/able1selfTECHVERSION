import { getSession } from "../../../../lib/auth-session";

export async function GET(request: Request) {
  const session = await getSession(request);
  return Response.json({
    ok: true,
    authenticated: Boolean(session),
    user: session
      ? {
          email: session.email,
          name: session.name,
          role: session.role,
          forcePasswordReset: session.forcePasswordReset,
        }
      : null,
  });
}
