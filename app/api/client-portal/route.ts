import { requireSession } from "../../../lib/auth-session";
import { getClientPortal, updateClientPortal } from "../../../lib/client-portal-store";

function fail(error: unknown) {
  if (error instanceof Response) return error;
  return Response.json({ ok:false, error:error instanceof Error ? error.message : "Portal request failed." }, { status:400 });
}

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const target = new URL(request.url).searchParams.get("member") ?? undefined;
    return Response.json({ ok:true, data:await getClientPortal(session.email, session.role, target) });
  } catch (error) { return fail(error); }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = await request.json() as Record<string, unknown>;
    return Response.json({ ok:true, data:await updateClientPortal(session.email, session.role, payload) });
  } catch (error) { return fail(error); }
}
