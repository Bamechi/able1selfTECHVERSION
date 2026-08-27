import { requireSession } from "../../../../lib/auth-session";
import { getClientPortal, updateClientPortal } from "../../../../lib/client-portal-store";

function adminOnly(role: string) {
  if (role !== "admin") throw new Response(JSON.stringify({ ok:false, error:"Admin access required." }), { status:403, headers:{"content-type":"application/json"} });
}

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    adminOnly(session.role);
    const target = new URL(request.url).searchParams.get("member") ?? session.email;
    return Response.json({ ok:true, data:await getClientPortal(session.email, session.role, target) });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ ok:false, error:"Admin portal request failed." }, { status:400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession(request);
    adminOnly(session.role);
    return Response.json({ ok:true, data:await updateClientPortal(session.email, session.role, await request.json() as Record<string, unknown>) });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ ok:false, error:error instanceof Error ? error.message : "Admin portal request failed." }, { status:400 });
  }
}
