import { requireSession } from "../../../../lib/auth-session";
import type { AnswerValue } from "../../../../lib/identity-engine";
import { updateMemberData } from "../../../../lib/member-store";

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = (await request.json()) as {
      moduleKey?: string;
      questionKey?: string;
      value?: unknown;
    };
    const data = await updateMemberData(session.email, {
      action: "save_response",
      moduleKey: payload.moduleKey,
      questionKey: payload.questionKey,
      answer: payload.value as AnswerValue,
    }, session.name);
    return Response.json({
      ok: true,
      progress: data.progress,
      identity: data.identity,
      derived: data.derived,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to save answer.",
      },
      { status: 400 },
    );
  }
}
