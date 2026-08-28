import { getD1 } from "./runtime";

export const MEASUREMENT_FIELDS = [
  ["neck", "Neck"], ["shoulders", "Shoulders"], ["chest", "Chest"],
  ["armhole", "Armhole"], ["bicep", "Bicep"], ["elbow", "Elbow"],
  ["wrist", "Wrist"], ["sleeve", "Sleeve"], ["jacket_length", "Jacket length"],
  ["stomach", "Stomach"], ["waist", "Waist"], ["hips", "Hips"],
  ["crotch", "Crotch"], ["thigh", "Thigh"], ["knee", "Knee"],
  ["calf", "Calf"], ["ankle", "Ankle"], ["outseam", "Outseam"],
  ["inseam", "Inseam"], ["short_jacket", "Short jacket"],
  ["flare_length", "Flare length"], ["flare_width", "Flare width"],
] as const;

const AMECHI_SEED: Record<string, string> = {
  neck:"17.5", shoulders:"19", chest:"43", armhole:"22.5", bicep:"14.75",
  elbow:"12.75", wrist:"7.5", sleeve:"25.25", jacket_length:"28.5", stomach:"36",
  waist:"35.75", hips:"42", crotch:"27", thigh:"20.75", knee:"17.5", calf:"16",
  ankle:"16", outseam:"40", inseam:"30.5", short_jacket:"25.5", flare_length:"42",
  flare_width:"",
};

async function memberForEmail(email: string) {
  const row = await getD1().prepare(
    `SELECT p.id, p.email, p.display_name, p.professional_title, p.created_at, a.role
     FROM member_profiles p JOIN member_accounts a ON lower(a.email) = lower(p.email)
     WHERE lower(p.email) = lower(?)`,
  ).bind(email).first<{ id:number; email:string; display_name:string; professional_title:string; created_at:string; role:string }>();
  if (!row) throw new Error("Member profile not found.");
  return row;
}

async function ensureClient(member: Awaited<ReturnType<typeof memberForEmail>>) {
  const db = getD1();
  const now = new Date().toISOString();
  await db.prepare(
    `INSERT OR IGNORE INTO client_profiles
     (member_id, preferred_name, updated_at) VALUES (?, ?, ?)`,
  ).bind(member.id, member.display_name, now).run();
  const existing = await db.prepare(
    "SELECT id FROM measurement_sets WHERE member_id = ? ORDER BY updated_at DESC LIMIT 1",
  ).bind(member.id).first<{id:number}>();
  if (!existing) {
    const created = await db.prepare(
      `INSERT INTO measurement_sets
       (member_id, label, measured_at, measured_by, unit, notes, created_at, updated_at)
       VALUES (?, 'Current', '', '', 'in', '', ?, ?) RETURNING id`,
    ).bind(member.id, now, now).first<{id:number}>();
    if (created && member.email.toLowerCase() === "amechi@addcolormedia.com") {
      await db.batch(MEASUREMENT_FIELDS.map(([key]) => db.prepare(
        "INSERT INTO measurements (set_id, measurement_key, value) VALUES (?, ?, ?)",
      ).bind(created.id, key, AMECHI_SEED[key] ?? "")));
    }
  }
}

export async function getClientPortal(email: string, role: string, targetEmail?: string) {
  const requested = role === "admin" && targetEmail ? targetEmail : email;
  const member = await memberForEmail(requested);
  await ensureClient(member);
  const db = getD1();
  const measurementSet = await db.prepare(
    "SELECT * FROM measurement_sets WHERE member_id = ? ORDER BY updated_at DESC LIMIT 1",
  ).bind(member.id).first<Record<string, unknown>>();
  const setId = Number(measurementSet?.id ?? 0);
  const [client, measurementRows, assets, appointments, orders, members, auditLog, adminStats] = await Promise.all([
    db.prepare("SELECT * FROM client_profiles WHERE member_id = ?").bind(member.id).first(),
    db.prepare("SELECT measurement_key, value FROM measurements WHERE set_id = ?").bind(setId).all<{measurement_key:string;value:string}>(),
    db.prepare("SELECT id, category, filename, content_type, size, caption, board_title, item_type, status, created_at FROM client_assets WHERE member_id = ? ORDER BY created_at DESC").bind(member.id).all(),
    db.prepare("SELECT * FROM appointments WHERE member_id = ? ORDER BY starts_at DESC").bind(member.id).all(),
    db.prepare("SELECT * FROM client_orders WHERE member_id = ? ORDER BY updated_at DESC").bind(member.id).all(),
    role === "admin"
      ? db.prepare(`SELECT p.email, p.display_name, a.role FROM member_profiles p
                    JOIN member_accounts a ON lower(a.email)=lower(p.email)
                    WHERE a.status='active' ORDER BY p.display_name`).all()
      : Promise.resolve({ results: [] }),
    role === "admin"
      ? db.prepare(`SELECT l.id, l.actor_email, l.action, l.detail_json, l.created_at,
                           p.email AS member_email, p.display_name
                    FROM admin_audit_log l
                    JOIN member_profiles p ON p.id=l.member_id
                    ORDER BY l.created_at DESC LIMIT 20`).all()
      : Promise.resolve({ results: [] }),
    role === "admin"
      ? db.prepare(`SELECT
          (SELECT COUNT(*) FROM member_accounts WHERE status='active') AS active_members,
          (SELECT COUNT(*) FROM client_orders) AS orders,
          (SELECT COUNT(*) FROM appointments) AS appointments,
          (SELECT COUNT(*) FROM client_assets) AS assets`).first()
      : Promise.resolve(null),
  ]);
  return {
    role,
    member,
    members: members.results,
    client,
    measurementSet,
    measurements: Object.fromEntries(measurementRows.results.map((row) => [row.measurement_key, row.value])),
    measurementFields: MEASUREMENT_FIELDS,
    assets: assets.results,
    appointments: appointments.results,
    orders: orders.results,
    auditLog: auditLog.results,
    adminStats,
  };
}

export async function updateClientPortal(
  actorEmail: string,
  role: string,
  payload: Record<string, unknown>,
) {
  const targetEmail = role === "admin" && typeof payload.targetEmail === "string" ? payload.targetEmail : actorEmail;
  if (payload.targetEmail && role !== "admin" && payload.targetEmail !== actorEmail) throw new Error("Admin access required.");
  const member = await memberForEmail(targetEmail);
  await ensureClient(member);
  const db = getD1();
  const now = new Date().toISOString();
  const action = String(payload.action ?? "");

  if (action === "save_measurements") {
    const set = await db.prepare("SELECT id FROM measurement_sets WHERE member_id = ? ORDER BY updated_at DESC LIMIT 1").bind(member.id).first<{id:number}>();
    if (!set) throw new Error("Measurement set not found.");
    const values = payload.measurements && typeof payload.measurements === "object" ? payload.measurements as Record<string, unknown> : {};
    const unit = payload.unit === "cm" ? "cm" : "in";
    await db.batch(MEASUREMENT_FIELDS.map(([key]) => db.prepare(
      `INSERT INTO measurements (set_id, measurement_key, value) VALUES (?, ?, ?)
       ON CONFLICT(set_id, measurement_key) DO UPDATE SET value=excluded.value`,
    ).bind(set.id, key, String(values[key] ?? ""))));
    await db.prepare(
      `UPDATE measurement_sets SET label=?, measured_at=?, measured_by=?, unit=?, notes=?, updated_at=? WHERE id=?`,
    ).bind(String(payload.label ?? "Current"), String(payload.measuredAt ?? ""), String(payload.measuredBy ?? ""), unit, String(payload.notes ?? ""), now, set.id).run();
  } else if (action === "save_client") {
    const occupation = String(payload.occupation ?? member.professional_title ?? "").slice(0, 120);
    await db.prepare(
      "UPDATE member_profiles SET professional_title=?, updated_at=? WHERE id=?",
    ).bind(occupation, now, member.id).run();
    if (role === "admin") {
      await db.prepare(
        `UPDATE client_profiles SET phone=?, preferred_name=?, birthday=?, member_status=?, next_delivery=?, shipping_address=?, calendly_url=?, stylist_notes=?, updated_at=? WHERE member_id=?`,
      ).bind(String(payload.phone ?? ""), String(payload.preferredName ?? ""), String(payload.birthday ?? ""), String(payload.memberStatus ?? "active"), String(payload.nextDelivery ?? ""), String(payload.shippingAddress ?? ""), String(payload.calendlyUrl ?? ""), String(payload.stylistNotes ?? ""), now, member.id).run();
    } else {
      await db.prepare(
        `UPDATE client_profiles SET phone=?, preferred_name=?, birthday=?, shipping_address=?, updated_at=? WHERE member_id=?`,
      ).bind(String(payload.phone ?? ""), String(payload.preferredName ?? ""), String(payload.birthday ?? ""), String(payload.shippingAddress ?? ""), now, member.id).run();
    }
  } else if (action === "add_order" && role === "admin") {
    await db.prepare(
      `INSERT INTO client_orders (member_id, order_number, title, status, amount, tracking_url, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(member.id, String(payload.orderNumber ?? ""), String(payload.title ?? "Order"), String(payload.status ?? "planning"), String(payload.amount ?? ""), String(payload.trackingUrl ?? ""), String(payload.notes ?? ""), now, now).run();
  } else if (action === "add_appointment" && role === "admin") {
    await db.prepare(
      `INSERT INTO appointments (member_id, title, starts_at, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, 'scheduled', ?, ?, ?)`,
    ).bind(member.id, String(payload.title ?? "Appointment"), String(payload.startsAt ?? ""), String(payload.notes ?? ""), now, now).run();
  } else if (action === "update_order" && role === "admin") {
    const orderId = Number(payload.orderId ?? 0);
    const order = await db.prepare(
      "SELECT id FROM client_orders WHERE id=? AND member_id=?",
    ).bind(orderId, member.id).first();
    if (!order) throw new Error("Order not found.");
    await db.prepare(
      `UPDATE client_orders SET status=?, amount=?, tracking_url=?, notes=?, updated_at=? WHERE id=?`,
    ).bind(String(payload.status ?? "planning"), String(payload.amount ?? ""), String(payload.trackingUrl ?? ""), String(payload.notes ?? ""), now, orderId).run();
  } else {
    throw new Error(role === "admin" ? "Unsupported portal action." : "Admin access required for that action.");
  }

  if (role === "admin") {
    await db.prepare(
      "INSERT INTO admin_audit_log (actor_email, member_id, action, detail_json, created_at) VALUES (?, ?, ?, ?, ?)",
    ).bind(actorEmail, member.id, action, JSON.stringify({ targetEmail }), now).run();
  }
  return getClientPortal(actorEmail, role, targetEmail);
}

export async function assetForRequest(email: string, role: string, id: number) {
  const row = await getD1().prepare(
    `SELECT a.*, p.email FROM client_assets a JOIN member_profiles p ON p.id=a.member_id WHERE a.id=?`,
  ).bind(id).first<Record<string, unknown>>();
  if (!row || (role !== "admin" && String(row.email).toLowerCase() !== email.toLowerCase())) throw new Error("File not found.");
  return row;
}
