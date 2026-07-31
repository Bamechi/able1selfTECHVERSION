import { requireSession } from "../../../../lib/auth-session";
import { getMemberData } from "../../../../lib/member-store";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const data = await getMemberData(session.email);
    return Response.json({
      ok: true,
      profile: {
        member: data.profile,
        identity: data.identity,
        derived: data.derived,
        sections: data.profileSections,
        synthesis: data.synthesis,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { ok: false, error: "Unable to load the assembled profile." },
      { status: 500 },
    );
  }
}
