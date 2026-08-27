import { requireSession } from "../../../lib/auth-session";
import { getMemberData } from "../../../lib/member-store";
import { getD1 } from "../../../lib/runtime";

function groundedAnswer(
  question: string,
  data: Awaited<ReturnType<typeof getMemberData>>,
) {
  const identity = data.identity;
  const lower = question.toLowerCase();
  const opening = identity
    ? `As ${identity.archetype.name}, your strongest usable edge is ${identity.archetype.edge.toLowerCase()}`
    : `Your clearest saved signal right now is your work pattern: ${data.insights.workPattern}.`;

  if (lower.includes("sell") || lower.includes("money") || lower.includes("revenue")) {
    return `${opening} Your current positioning is "${data.insights.positioning}." Lead with one result, one audience, and one offer. This week, write a one-sentence offer with a named buyer, measurable result, price, and next step; then send it to three people already in your network.`;
  }
  if (lower.includes("blind") || lower.includes("stuck") || lower.includes("cost")) {
    return `${opening} The pattern to watch is ${(identity?.archetype.blindSpots[0] ?? "waiting for more certainty than the next move requires").toLowerCase()}. Your stated direction is ${data.insights.direction}. This week, choose the smallest visible deliverable that advances that direction and put a date beside it.`;
  }
  if (lower.includes("partner") || lower.includes("network") || lower.includes("room")) {
    return `${opening} Your saved network style is ${data.insights.network}. Choose a partner who complements that pattern and will ask for evidence, not intention. This week, send one direct invitation that names the goal, weekly cadence, and first check-in date.`;
  }
  return `${opening} Your natural value currently reads as ${data.insights.naturalValue}. Apply that strength to ${data.insights.direction}. This week, complete one action small enough to finish in 45 minutes and attach a visible receipt to it: a sent message, booked meeting, published page, or finished draft.`;
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const body = (await request.json()) as { question?: string };
    const question = body.question?.trim().slice(0, 1200) ?? "";
    if (!question) {
      return Response.json({ ok: false, error: "Ask a question first." }, { status: 400 });
    }
    const data = await getMemberData(session.email, session.name);
    const answer = groundedAnswer(question, data);
    const now = new Date().toISOString();
    await getD1().batch([
      getD1().prepare("INSERT INTO guide_messages (member_id, role, body, grounded_on_engine_version, created_at) VALUES (?, 'member', ?, '2.1-deterministic', ?)").bind(data.profile.id, question, now),
      getD1().prepare("INSERT INTO guide_messages (member_id, role, body, grounded_on_engine_version, created_at) VALUES (?, 'assistant', ?, '2.1-deterministic', ?)").bind(data.profile.id, answer, now),
    ]);
    return Response.json({ ok: true, answer, mode: "deterministic" });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Guide request failed." },
      { status: 400 },
    );
  }
}
