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
const seededResources = [
  ["hiring", "Brand identity designer for boutique launch", "North House Studio", "Remote / Atlanta", "freelance", "$3,500-$6,000", "Looking for a designer who can create a clean launch identity, social templates, and a simple usage guide for a premium lifestyle concept.", "Submit portfolio and two relevant case studies."],
  ["offer", "One-day content direction intensive", "ABLE member offer", "Remote", "service", "$750 member rate", "A focused strategy day for founders who need content pillars, shoot direction, and a practical 30-day capture list before a campaign.", "Submit your launch date and current offer."],
  ["opportunity", "Pop-up vendor table at creative wellness market", "Sunday House Market", "Charlotte, NC", "collaboration", "Revenue share / vendor split", "Two tables open for fashion, grooming, print, or personal brand products at an invite-only wellness and creative market.", "Send product photos and expected setup needs."],
  ["hiring", "Part-time operations assistant for fashion client work", "Private studio", "New York / Hybrid", "part-time", "$28-$40/hr", "Support fittings, client follow-up, sample tracking, appointment prep, and vendor communication for a designer-led studio.", "Reply with availability and operations background."],
  ["offer", "Legal setup checklist review", "Member professional service", "Remote", "service", "$300 fixed", "Review LLC, EIN, trademark, insurance, contracts, and payment setup. Built for early founders who need the basics checked without extra noise.", "List what you already have and what is missing."],
  ["hiring", "Short-form editor for founder story reels", "Add Color Media partner", "Remote", "freelance", "$1,200-$2,000/mo", "Need a tasteful editor for weekly founder reels, quote cuts, and event recap clips. Premium, minimal, not overproduced.", "Send three vertical edits and turnaround time."],
  ["opportunity", "Featured member spotlight submissions", "ABLE1Self editorial", "Digital", "other", "Audience feature", "Collecting member stories for a future spotlight series: what you are building, your ABLE stage, and the decision you are making next.", "Submit a 150-word profile note."],
] as const;

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

async function seedResources(memberId: number) {
  const db = getD1();
  const existing = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM member_resources
       WHERE member_id = ? AND title IN (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(memberId, ...seededResources.map((resource) => resource[1]))
    .first<{ count: number }>();
  if ((existing?.count ?? 0) >= seededResources.length) return;
  const now = new Date().toISOString();
  for (const resource of seededResources) {
    const duplicate = await db
      .prepare("SELECT id FROM member_resources WHERE member_id = ? AND title = ?")
      .bind(memberId, resource[1])
      .first();
    if (duplicate) continue;
    await db
      .prepare(
        `INSERT INTO member_resources
         (member_id, resource_type, title, organization, location, engagement,
          compensation, summary, contact, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
      )
      .bind(memberId, ...resource, now, now)
      .run();
  }
}

export async function GET(request: Request) {
  try {
    const profile = await member(request);
    await seedResources(profile.id);
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
    } else if (payload.action === "capture" || payload.action === "apply") {
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
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(resource_id, member_id) DO UPDATE SET
             note = excluded.note,
             status = excluded.status,
             updated_at = excluded.updated_at`,
        )
        .bind(resourceId, profile.id, clean(payload.note, 500), payload.action === "apply" ? "applied" : "saved", now, now)
        .run();
    } else {
      throw new Error("Unknown resource action.");
    }

    return Response.json({ ok: true }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return failure(error);
  }
}
