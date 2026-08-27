import { requireSession } from "../../../../lib/auth-session";
import { assetForRequest } from "../../../../lib/client-portal-store";
import { getMemberUploads } from "../../../../lib/runtime";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(id)) throw new Error("File not found.");
    const asset = await assetForRequest(session.email, session.role, id);
    const object = await getMemberUploads().get(String(asset.object_key));
    if (!object) throw new Error("File not found.");
    return new Response(object.body, {
      headers:{
        "content-type":String(asset.content_type),
        "content-disposition":`inline; filename="${String(asset.filename).replaceAll('"', '')}"`,
        "cache-control":"private, max-age=300",
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ ok:false, error:"File not found." }, { status:404 });
  }
}
