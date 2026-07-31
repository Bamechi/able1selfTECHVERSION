import { requireSession } from "../../../../lib/auth-session";
import { getMemberData } from "../../../../lib/member-store";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const data = await getMemberData(session.email);
    return Response.json({ ok: true, identity: data.identity });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { ok: false, error: "Unable to load the identity result." },
      { status: 500 },
    );
  }
}
