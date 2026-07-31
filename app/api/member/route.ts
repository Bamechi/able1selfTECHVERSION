import { requireSession } from "../../../lib/auth-session";
import { getMemberData, updateMemberData } from "../../../lib/member-store";

function errorResponse(error: unknown) {
  if (error instanceof Response) return error;
  const message =
    error instanceof Error ? error.message : "Unable to update the member portal.";
  return Response.json({ ok: false, error: message }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    return Response.json({
      ok: true,
      data: await getMemberData(session.email),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = (await request.json()) as Record<string, unknown>;
    return Response.json({
      ok: true,
      data: await updateMemberData(session.email, payload),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
