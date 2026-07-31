import { requireSession } from "../../../../../lib/auth-session";
import { updateMemberData } from "../../../../../lib/member-store";

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = (await request.json()) as { moduleKey?: string };
    const data = await updateMemberData(session.email, {
      action: "complete_module",
      moduleKey: payload.moduleKey,
    }, session.name);
    return Response.json({
      ok: true,
      progress: data.progress,
      unlocks: data.unlocks,
      identity: data.identity,
      profileSections: data.profileSections,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unable to complete module.",
      },
      { status: 400 },
    );
  }
}
