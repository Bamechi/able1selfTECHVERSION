import { requireSession } from "../../../lib/auth-session";
import { getD1 } from "../../../lib/runtime";

type ResourcePayload = {
  action?: string;
  resourceType?: string;
  title?: string;
  organization?: string;
  location?: string;
  engagement?: string;
  compensation?: string;
  summary?: string;
  contact?: string;
  resourceId?: number;
  note?: string;
};

const allowedTypes = new Set(["offer", "hiring", "opportunity"]);
const allowedEngagement = new Set(["freelance", "full-time", "part-time", "service", "collaboration", "other"]);

async function member(request: Request) {
  const session = await requireSession(request);
  const profile = await getD1()
    .prepare("SELECT id, display_name FROM member_profiles WHERE email = ?")
    .bind(session.email)
    .first<{ id: number; display_name: string }>();
  if (!profile) throw new Error("Open your member dashboard first.");
  return profile;
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function failure(error: unknown) {
  if (error instanceof Response) return error;
  return Response.json(
    { ok: false, error: error instanceof Error ? error.message : "Unable to load resources." },
    { status: 400 },
  );
}

export async function GET(request: Request) {
  try {
    const profile = await member(request);
    const db = getD1();
    const [resources, captures] = await Promise.all([
      db
        .prepare(
          `SELECT r.id, r.member_id, COALESCE(cm.display_name, mp.display_name) AS author_name,
                  r.resource_type, r.title, r.organization, r.location, r.engagement,
                  r.compensation, r.summary, r.contact, r.status, r.created_at, r.updated_at,
                  COUNT(c.id) AS capture_count
           FROM member_resources r
           LEFT JOIN community_members cm ON cm.member_id = r.member_id
           LEFT JOIN member_profiles mp ON mp.id = r.member_id
           LEFT JOIN resource_captures c ON c.resource_id = r.id
           WHERE r.status = 'open'
           GROUP BY r.id
           ORDER BY r.id DESC
           LIMIT 120`,
        )
        .all(),
      db
        .prepare(
          `SELECT c.id, c.resource_id, c.note, c.status, c.created_at, c.updated_at
           FROM resource_captures c
           WHERE c.member_id = ?
           ORDER BY c.updated_at DESC`,
        )
        .bind(profile.id)
        .all(),
    ]);
    return Response.json(
      { ok: true, selfId: profile.id, resources: resources.results, captures: captures.results },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const profile = await member(request);
    const db = getD1();
    const payload = (await request.json()) as ResourcePayload;
    const now = new Date().toISOString();

    if (payload.action === "add") {
      const resourceType = allowedTypes.has(payload.resourceType ?? "") ? payload.resourceType : "";
      const engagement = allowedEngagement.has(payload.engagement ?? "") ? payload.engagement : "other";
      const title = clean(payload.title, 120);
      const summary = clean(payload.summary, 900);
      if (!resourceType || !title || !summary) {
        throw new Error("Add a resource type, title, and clear summary.");
      }
      await db
        .prepare(
          `INSERT INTO member_resources
           (member_id, resource_type, title, organization, location, engagement,
            compensation, summary, contact, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
        )
        .bind(
          profile.id,
          resourceType,
          title,
          clean(payload.organization, 120),
          clean(payload.location, 120),
          engagement,
          clean(payload.compensation, 120),
          summary,
          clean(payload.contact, 180),
          now,
          now,
        )
        .run();
    } else if (payload.action === "capture") {
      const resourceId = Number(payload.resourceId);
      if (!Number.isInteger(resourceId)) throw new Error("Choose a valid resource.");
      const resource = await db
        .prepare("SELECT id FROM member_resources WHERE id = ? AND status = 'open'")
        .bind(resourceId)
        .first<{ id: number }>();
      if (!resource) throw new Error("This resource is no longer available.");
      await db
        .prepare(
          `INSERT INTO resource_captures (resource_id, member_id, note, status, created_at, updated_at)
           VALUES (?, ?, ?, 'saved', ?, ?)
           ON CONFLICT(resource_id, member_id) DO UPDATE SET
             note = excluded.note,
             status = 'saved',
             updated_at = excluded.updated_at`,
        )
        .bind(resourceId, profile.id, clean(payload.note, 500), now, now)
        .run();
    } else {
      throw new Error("Unknown resource action.");
    }

    return Response.json({ ok: true }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return failure(error);
  }
}
