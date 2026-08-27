import { requireSession } from "../../../../lib/auth-session";
import { getClientPortal } from "../../../../lib/client-portal-store";
import { getD1, getMemberUploads } from "../../../../lib/runtime";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const form = await request.formData();
    const file = form.get("file");
    const category = String(form.get("category") ?? "vision");
    const targetEmail = session.role === "admin" ? String(form.get("member") ?? session.email) : session.email;
    if (!(file instanceof File) || !ALLOWED.has(file.type) || file.size > 10 * 1024 * 1024) {
      return Response.json({ ok:false, error:"Upload a JPG, PNG, WebP, or PDF up to 10 MB." }, { status:400 });
    }
    if (!["profile", "vision", "closet"].includes(category)) {
      return Response.json({ ok:false, error:"Invalid file category." }, { status:400 });
    }
    const portal = await getClientPortal(session.email, session.role, targetEmail);
    const objectKey = `${portal.member.id}/${category}/${crypto.randomUUID()}`;
    await getMemberUploads().put(objectKey, file.stream(), { httpMetadata:{ contentType:file.type }, customMetadata:{ filename:file.name } });
    const now = new Date().toISOString();
    await getD1().prepare(
      `INSERT INTO client_assets (member_id, category, object_key, filename, content_type, size, caption, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(portal.member.id, category, objectKey, file.name.slice(0,180), file.type, file.size, String(form.get("caption") ?? "").slice(0,300), now).run();
    if (session.role === "admin") {
      await getD1().prepare("INSERT INTO admin_audit_log (actor_email, member_id, action, detail_json, created_at) VALUES (?, ?, 'upload_asset', ?, ?)")
        .bind(session.email, portal.member.id, JSON.stringify({ category, filename:file.name }), now).run();
    }
    return Response.json({ ok:true, data:await getClientPortal(session.email, session.role, targetEmail) });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ ok:false, error:error instanceof Error ? error.message : "Upload failed." }, { status:400 });
  }
}
