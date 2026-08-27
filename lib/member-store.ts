import {
  ARCHETYPES,
  assembleProfile,
  type AnswerSet,
  type AnswerValue,
  type AssembledProfile,
} from "./identity-engine";
import {
  isModuleUnlocked,
  moduleMap,
  nextModule,
  programModules,
  requiredQuestionKeys,
} from "./program-data";
import { displayNameFromEmail } from "./auth-accounts";
import { getD1 } from "./runtime";

type ProfileRow = {
  id: number;
  email: string;
  display_name: string;
  professional_title: string;
  bio: string;
  current_module: string;
  created_at: string;
  updated_at: string;
};

type ProgressRow = {
  module_key: string;
  stage: string;
  module_order: number;
  status: string;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
};

type ResponseRow = {
  module_key: string;
  question_key: string;
  answer: string;
  updated_at: string;
};

type IdentityRow = {
  code: string;
  archetype_name: string;
  provisional: number;
  confidence: number;
  axes_json: string;
  style_archetype: string;
  palette_json: string;
  energy_json: string;
  income_streams_json: string;
  brand_statement: string;
  engine_version: string;
  computed_at: string;
};

const profileSectionKeyByModule: Record<string, string> = {
  A1: "personality_snapshot",
  A2: "energy_profile",
  A3: "self_discovery",
  B0: "brand_signal",
  B1: "style_archetype",
  B2: "image_plan",
  B3: "brand_statement",
  B4: "brand_ledger",
  L1: "network_map",
  L2: "monetization_roadmap",
  L3: "opportunity_list",
  E1: "activation_goal",
  E2: "ninety_day_blueprint",
  E3: "accountability_plan",
};

function encodeAnswer(value: AnswerValue) {
  return JSON.stringify(value);
}

function decodeAnswer(value: string): AnswerValue {
  try {
    return JSON.parse(value) as AnswerValue;
  } catch {
    return value;
  }
}

function hasAnswer(value: AnswerValue) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    if ("date" in value || "fullName" in value) {
      const birth = value as Record<string, unknown>;
      return ["fullName", "date", "time", "city", "country", "timezone", "latitude", "longitude"]
        .every((key) => birth[key] !== undefined && birth[key] !== null && String(birth[key]).trim().length > 0);
    }
    return Object.values(value).some(
      (item) => typeof item === "string" && item.trim().length > 0,
    );
  }
  return true;
}

function rowsToAnswers(rows: ResponseRow[]): AnswerSet {
  return Object.fromEntries(
    rows.map((row) => [row.question_key, decodeAnswer(row.answer)]),
  );
}

async function ensurePilot(email: string, preferredName?: string) {
  const db = getD1();
  const now = new Date().toISOString();

  const defaultName =
    preferredName?.trim() ||
    displayNameFromEmail(email);
  await db
    .prepare(
      `INSERT OR IGNORE INTO member_profiles
       (email, display_name, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(email, defaultName, now, now)
    .run();

  const profile = await db
    .prepare("SELECT * FROM member_profiles WHERE email = ?")
    .bind(email)
    .first<ProfileRow>();
  if (!profile) throw new Error("Unable to initialize the member profile.");

  await db
    .prepare(
      `DELETE FROM profile_sections WHERE member_id = ?
       AND section_key IN ('self_discovery_profile', 'personal_brand_statement', '90_day_blueprint')`,
    )
    .bind(profile.id)
    .run();

  await db.batch(
    programModules.map((programModule) =>
      db
        .prepare(
          `INSERT INTO module_progress
           (member_id, module_key, stage, module_order, status, progress, updated_at)
           VALUES (?, ?, ?, ?, 'not_started', 0, ?)
           ON CONFLICT(member_id, module_key) DO UPDATE SET
             stage = excluded.stage,
             module_order = excluded.module_order`,
        )
        .bind(
          profile.id,
          programModule.key,
          programModule.stage,
          programModule.order,
          now,
        ),
    ),
  );

  const legacyAnswers = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM survey_responses
       WHERE member_id = ? AND question_key GLOB '[A-Z][0-9]_Q*'`,
    )
    .bind(profile.id)
    .first<{ count: number }>();
  if (legacyAnswers?.count) {
    await db.batch([
      db
        .prepare("DELETE FROM survey_responses WHERE member_id = ?")
        .bind(profile.id),
      db
        .prepare(
          `UPDATE module_progress SET status = 'not_started', progress = 0,
           started_at = NULL, completed_at = NULL, updated_at = ?
           WHERE member_id = ?`,
        )
        .bind(now, profile.id),
      db
        .prepare("DELETE FROM identity_results WHERE member_id = ?")
        .bind(profile.id),
      db
        .prepare(
          `UPDATE profile_sections SET locked = 1, content_json = '{}',
           updated_at = ? WHERE member_id = ?`,
        )
        .bind(now, profile.id),
      db
        .prepare("DELETE FROM notifications WHERE member_id = ?")
        .bind(profile.id),
      db
        .prepare(
          `UPDATE member_profiles SET current_module = 'A1', updated_at = ?
           WHERE id = ?`,
        )
        .bind(now, profile.id),
    ]);
  }

  await db.batch([
    db
      .prepare(
        `INSERT OR IGNORE INTO member_settings
         (member_id, module_reminders, message_notifications, community_notifications, updated_at)
         VALUES (?, 1, 1, 0, ?)`,
      )
      .bind(profile.id, now),
    db
      .prepare(
        `INSERT OR IGNORE INTO member_birth_data
         (member_id, updated_at) VALUES (?, ?)`,
      )
      .bind(profile.id, now),
  ]);

  await db.batch(
    programModules.map((programModule) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO profile_sections
           (member_id, section_key, module_key, stage, title, locked, content_json, updated_at)
           VALUES (?, ?, ?, ?, ?, 1, '{}', ?)`,
        )
        .bind(
          profile.id,
          profileSectionKeyByModule[programModule.key],
          programModule.key,
          programModule.stage,
          programModule.deliverable,
          now,
        ),
    ),
  );

  const postCount = await db
    .prepare("SELECT COUNT(*) AS count FROM community_posts WHERE member_id = ?")
    .bind(profile.id)
    .first<{ count: number }>();
  if (!postCount?.count) {
    await db.batch([
      db
        .prepare(
          `INSERT INTO community_posts
           (member_id, author_name, body, created_at) VALUES (?, ?, ?, ?)`,
        )
        .bind(
          profile.id,
          "Shawn Daniels",
          "What decision becomes easier when you stop asking who you should be and start from who you already are?",
          now,
        ),
      db
        .prepare(
          `INSERT INTO community_posts
           (member_id, author_name, body, created_at) VALUES (?, ?, ?, ?)`,
        )
        .bind(
          profile.id,
          "Kiara M.",
          "My professional statement finally sounds like me instead of a résumé.",
          new Date(Date.now() - 86400000).toISOString(),
        ),
    ]);
  }

  const messageCount = await db
    .prepare("SELECT COUNT(*) AS count FROM messages WHERE member_id = ?")
    .bind(profile.id)
    .first<{ count: number }>();
  if (!messageCount?.count) {
    await db.batch([
      db
        .prepare(
          `INSERT INTO messages
           (member_id, sender, body, created_at) VALUES (?, 'partner', ?, ?)`,
        )
        .bind(
          profile.id,
          "What is the one thing you are committing to before Friday?",
          now,
        ),
      db
        .prepare(
          `INSERT INTO messages
           (member_id, sender, body, created_at) VALUES (?, 'partner', ?, ?)`,
        )
        .bind(
          profile.id,
          "I’ll be here to help you keep it specific and measurable.",
          new Date(Date.now() + 1000).toISOString(),
        ),
    ]);
  }

  const notificationCount = await db
    .prepare("SELECT COUNT(*) AS count FROM notifications WHERE member_id = ?")
    .bind(profile.id)
    .first<{ count: number }>();
  if (!notificationCount?.count) {
    await db.batch([
      db
        .prepare(
          `INSERT INTO notifications
           (member_id, title, body, is_read, created_at) VALUES (?, ?, ?, 0, ?)`,
        )
        .bind(
          profile.id,
          "Your profile is ready",
          "Begin with Analyze · Know Your Type. Every answer will save automatically.",
          now,
        ),
      db
        .prepare(
          `INSERT INTO notifications
           (member_id, title, body, is_read, created_at) VALUES (?, ?, ?, 0, ?)`,
        )
        .bind(
          profile.id,
          "Accountability connected",
          "Your test conversation with Jordan is available in Messages.",
          now,
        ),
    ]);
  }

  return profile;
}

async function persistAssembledProfile(
  memberId: number,
): Promise<AssembledProfile> {
  const db = getD1();
  const [responseResult, progressResult, birthData] = await Promise.all([
    db
      .prepare(
        `SELECT module_key, question_key, answer, updated_at
         FROM survey_responses WHERE member_id = ?`,
      )
      .bind(memberId)
      .all<ResponseRow>(),
    db
      .prepare(
        `SELECT module_key FROM module_progress
         WHERE member_id = ? AND status = 'complete'`,
      )
      .bind(memberId)
      .all<{ module_key: string }>(),
    db
      .prepare(
        `SELECT full_birth_name FROM member_birth_data WHERE member_id = ?`,
      )
      .bind(memberId)
      .first<{ full_birth_name: string }>(),
  ]);
  const assembled = assembleProfile({
    answers: rowsToAnswers(responseResult.results),
    completedModules: (progressResult.results as Array<{ module_key: string }>).map(
      (row) => row.module_key,
    ),
    fullBirthName: birthData?.full_birth_name,
  });
  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE member_birth_data SET sun_sign = ?, moon_sign = ?, rising_sign = ?,
       ephemeris_status = ?, chart_json = ?, updated_at = ? WHERE member_id = ?`,
    )
    .bind(
      assembled.energy.sunSign ?? "",
      assembled.energy.moonSign ?? "",
      assembled.energy.risingSign ?? "",
      assembled.energy.moonRisingStatus,
      JSON.stringify(assembled.energy.chart ?? {}),
      now,
      memberId,
    )
    .run();

  await db.batch(
    assembled.sections.map((section) =>
      db
        .prepare(
          `INSERT INTO profile_sections
           (member_id, section_key, module_key, stage, title, locked, content_json, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(member_id, section_key) DO UPDATE SET
             locked = excluded.locked, content_json = excluded.content_json,
             title = excluded.title, updated_at = excluded.updated_at`,
        )
        .bind(
          memberId,
          section.key,
          section.moduleKey,
          section.stage,
          section.title,
          section.locked ? 1 : 0,
          JSON.stringify(section.content ?? {}),
          now,
        ),
    ),
  );

  if (assembled.identity) {
    await db
      .prepare(
        `INSERT INTO identity_results
         (member_id, code, archetype_name, provisional, confidence, axes_json,
          style_archetype, palette_json, energy_json, income_streams_json,
          brand_statement, engine_version, computed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '2.0', ?)
         ON CONFLICT(member_id) DO UPDATE SET
          code = excluded.code, archetype_name = excluded.archetype_name,
          provisional = excluded.provisional, confidence = excluded.confidence,
          axes_json = excluded.axes_json, style_archetype = excluded.style_archetype,
          palette_json = excluded.palette_json, energy_json = excluded.energy_json,
          income_streams_json = excluded.income_streams_json,
          brand_statement = excluded.brand_statement, computed_at = excluded.computed_at`,
      )
      .bind(
        memberId,
        assembled.identity.code,
        assembled.identity.archetype.name,
        assembled.identity.provisional ? 1 : 0,
        Math.round(assembled.identity.confidence * 100),
        JSON.stringify(assembled.identity.axes),
        assembled.styleArchetype ?? "",
        JSON.stringify(assembled.palette ?? {}),
        JSON.stringify(assembled.energy),
        JSON.stringify(assembled.incomeStreams),
        assembled.brandStatement ?? "",
        now,
      )
      .run();
  }

  return assembled;
}

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function getMemberData(email: string, preferredName?: string) {
  const profile = await ensurePilot(email, preferredName);
  const db = getD1();
  const [
    progressResult,
    responsesResult,
    planResult,
    settings,
    postsResult,
    messagesResult,
    notificationsResult,
    identityRow,
    sectionsResult,
    birthData,
    synthesis,
  ] = await Promise.all([
    db
      .prepare(
        `SELECT module_key, stage, module_order, status, progress,
                started_at, completed_at, updated_at
         FROM module_progress WHERE member_id = ? ORDER BY module_order`,
      )
      .bind(profile.id)
      .all<ProgressRow>(),
    db
      .prepare(
        `SELECT module_key, question_key, answer, updated_at
         FROM survey_responses WHERE member_id = ? ORDER BY updated_at`,
      )
      .bind(profile.id)
      .all<ResponseRow>(),
    db
      .prepare(
        `SELECT id, title, due_date, status, sort_order, created_at, updated_at
         FROM action_plan_items WHERE member_id = ? ORDER BY sort_order, id`,
      )
      .bind(profile.id)
      .all(),
    db
      .prepare(
        `SELECT module_reminders, message_notifications,
                community_notifications, updated_at
         FROM member_settings WHERE member_id = ?`,
      )
      .bind(profile.id)
      .first(),
    db
      .prepare(
        `SELECT id, author_name, body, created_at FROM community_posts
         WHERE member_id = ? ORDER BY created_at DESC LIMIT 30`,
      )
      .bind(profile.id)
      .all(),
    db
      .prepare(
        `SELECT id, sender, body, created_at FROM messages
         WHERE member_id = ? ORDER BY created_at ASC LIMIT 100`,
      )
      .bind(profile.id)
      .all(),
    db
      .prepare(
        `SELECT id, title, body, is_read, created_at FROM notifications
         WHERE member_id = ? ORDER BY created_at DESC LIMIT 30`,
      )
      .bind(profile.id)
      .all(),
    db
      .prepare("SELECT * FROM identity_results WHERE member_id = ?")
      .bind(profile.id)
      .first<IdentityRow>(),
    db
      .prepare(
        `SELECT section_key, module_key, stage, title, locked, content_json, updated_at
         FROM profile_sections WHERE member_id = ? ORDER BY id`,
      )
      .bind(profile.id)
      .all<{
        section_key: string;
        module_key: string;
        stage: string;
        title: string;
        locked: number;
        content_json: string;
        updated_at: string;
      }>(),
    db
      .prepare("SELECT * FROM member_birth_data WHERE member_id = ?")
      .bind(profile.id)
      .first(),
    db
      .prepare(
        `SELECT narrative, review_status, share_enabled, generated_at
         FROM profile_synthesis WHERE member_id = ?`,
      )
      .bind(profile.id)
      .first(),
  ]);

  const progress = progressResult.results as ProgressRow[];
  const responses = (responsesResult.results as ResponseRow[]).map((row) => ({
    ...row,
    answer: decodeAnswer(row.answer),
  }));
  const completed = progress
    .filter((item) => item.status === "complete")
    .map((item) => item.module_key);
  const current = nextModule(completed);
  const identity = identityRow
    ? {
        code: identityRow.code,
        archetype: ARCHETYPES[identityRow.code],
        provisional: Boolean(identityRow.provisional),
        confidence: identityRow.confidence / 100,
        axes: parseJson(identityRow.axes_json, []),
        computedAt: identityRow.computed_at,
      }
    : null;

  return {
    profile: {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      professionalTitle: profile.professional_title,
      bio: profile.bio,
      currentModule: current.key,
      overallProgress: Math.round((completed.length / programModules.length) * 100),
      completedModules: completed.length,
    },
    progress,
    responses,
    plan: planResult.results,
    settings,
    posts: postsResult.results,
    messages: messagesResult.results,
    notifications: notificationsResult.results,
    identity,
    derived: identityRow
      ? {
          styleArchetype: identityRow.style_archetype || null,
          palette: parseJson(identityRow.palette_json, null),
          energy: parseJson(identityRow.energy_json, {}),
          incomeStreams: parseJson(identityRow.income_streams_json, []),
          brandStatement: identityRow.brand_statement || null,
          engineVersion: identityRow.engine_version,
        }
      : null,
    profileSections: (sectionsResult.results as Array<{
      section_key: string;
      module_key: string;
      stage: string;
      title: string;
      locked: number;
      content_json: string;
      updated_at: string;
    }>).map((section) => ({
      key: section.section_key,
      moduleKey: section.module_key,
      stage: section.stage,
      title: section.title,
      locked: Boolean(section.locked),
      content: parseJson(section.content_json, {}),
      updatedAt: section.updated_at,
    })),
    birthData,
    synthesis,
    unlocks: Object.fromEntries(
      programModules.map((programModule) => [
        programModule.key,
        isModuleUnlocked(programModule.key, completed),
      ]),
    ),
    insights: {
      workPattern:
        String(rowsToAnswers(responsesResult.results)["a1_pace"] ?? "") ||
        "Complete A1 to reveal your working rhythm",
      naturalValue:
        (rowsToAnswers(responsesResult.results)["a1_strengths"] as string[] | undefined)?.join(" · ") ||
        "Complete A1 to reveal your natural strengths",
      energySource:
        String(rowsToAnswers(responsesResult.results)["a2_recharge"] ?? "") ||
        "Complete A2 to map your energy",
      positioning:
        identityRow?.brand_statement || "Complete Brand to build your statement",
      network:
        String(rowsToAnswers(responsesResult.results)["l1_net_style"] ?? "") ||
        "Complete L1 to map your network",
      direction:
        String(rowsToAnswers(responsesResult.results)["e2_m3"] ?? "") ||
        "Complete E2 to set your 90-day outcome",
    },
  };
}

type MemberAction = {
  action?: string;
  moduleKey?: string;
  questionKey?: string;
  answer?: AnswerValue;
  title?: string;
  dueDate?: string;
  id?: number;
  status?: string;
  displayName?: string;
  professionalTitle?: string;
  bio?: string;
  body?: string;
  moduleReminders?: boolean;
  messageNotifications?: boolean;
  communityNotifications?: boolean;
};

export async function updateMemberData(
  email: string,
  payload: MemberAction,
  preferredName?: string,
) {
  const profile = await ensurePilot(email, preferredName);
  const db = getD1();
  const now = new Date().toISOString();

  if (payload.action === "save_response") {
    const programModule = payload.moduleKey ? moduleMap[payload.moduleKey] : null;
    const question = programModule?.questions.find(
      (item) => item.key === payload.questionKey,
    );
    if (!programModule || !question || question.control === "derived" || !hasAnswer(payload.answer)) {
      throw new Error("A valid module question and answer are required.");
    }
    const completedResult = await db
      .prepare(
        `SELECT module_key FROM module_progress
         WHERE member_id = ? AND status = 'complete'`,
      )
      .bind(profile.id)
      .all<{ module_key: string }>();
    const completed = (
      completedResult.results as Array<{ module_key: string }>
    ).map((item) => item.module_key);
    if (!completed.includes(programModule.key) && !isModuleUnlocked(programModule.key, completed)) {
      throw new Error("Complete the previous module to unlock this one.");
    }
    await db
      .prepare(
        `INSERT INTO survey_responses
         (member_id, module_key, question_key, answer, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(member_id, question_key)
         DO UPDATE SET answer = excluded.answer, updated_at = excluded.updated_at`,
      )
      .bind(
        profile.id,
        programModule.key,
        question.key,
        encodeAnswer(payload.answer),
        now,
      )
      .run();

    if (question.control === "birth" && typeof payload.answer === "object" && !Array.isArray(payload.answer)) {
      const birth = payload.answer as Record<string, unknown>;
      await db
        .prepare(
          `UPDATE member_birth_data SET full_birth_name = ?, birth_date = ?,
           birth_time = ?, birth_city = ?, birth_state = ?, birth_country = ?,
           latitude = ?, longitude = ?, timezone = ?, updated_at = ? WHERE member_id = ?`,
        )
        .bind(
          typeof birth.fullName === "string" ? birth.fullName : "",
          typeof birth.date === "string" ? birth.date : "",
          typeof birth.time === "string" ? birth.time : "",
          typeof birth.city === "string" ? birth.city : "",
          typeof birth.state === "string" ? birth.state : "",
          typeof birth.country === "string" ? birth.country : "",
          typeof birth.latitude === "number" ? String(birth.latitude) : "",
          typeof birth.longitude === "number" ? String(birth.longitude) : "",
          typeof birth.timezone === "string" ? birth.timezone : "",
          now,
          profile.id,
        )
        .run();
    }

    const responseResult = await db
      .prepare(
        `SELECT module_key, question_key, answer, updated_at
         FROM survey_responses WHERE member_id = ? AND module_key = ?`,
      )
      .bind(profile.id, programModule.key)
      .all<ResponseRow>();
    const answers = rowsToAnswers(responseResult.results);
    const required = requiredQuestionKeys(programModule.key);
    const answered = required.filter((key) => hasAnswer(answers[key])).length;
    const progress = required.length
      ? Math.min(95, Math.round((answered / required.length) * 95))
      : 95;
    await db
      .prepare(
        `UPDATE module_progress
         SET status = CASE WHEN status = 'complete' THEN status ELSE 'in_progress' END,
             progress = CASE WHEN status = 'complete' THEN 100 ELSE ? END,
             started_at = COALESCE(started_at, ?), updated_at = ?
         WHERE member_id = ? AND module_key = ?`,
      )
      .bind(progress, now, now, profile.id, programModule.key)
      .run();
    if (completed.includes(programModule.key)) {
      await persistAssembledProfile(profile.id);
    }
  } else if (payload.action === "complete_module") {
    const programModule = payload.moduleKey ? moduleMap[payload.moduleKey] : null;
    if (!programModule) throw new Error("A valid module is required.");
    const [responsesResult, completedResult] = await Promise.all([
      db
        .prepare(
          `SELECT module_key, question_key, answer, updated_at
           FROM survey_responses WHERE member_id = ? AND module_key = ?`,
        )
        .bind(profile.id, programModule.key)
        .all<ResponseRow>(),
      db
        .prepare(
          `SELECT module_key FROM module_progress
           WHERE member_id = ? AND status = 'complete'`,
        )
        .bind(profile.id)
        .all<{ module_key: string }>(),
    ]);
    const completed = (
      completedResult.results as Array<{ module_key: string }>
    ).map((item) => item.module_key);
    if (!completed.includes(programModule.key) && !isModuleUnlocked(programModule.key, completed)) {
      throw new Error("Complete the previous module to unlock this one.");
    }
    const answers = rowsToAnswers(responsesResult.results);
    const missing = requiredQuestionKeys(programModule.key).filter(
      (key) => !hasAnswer(answers[key]),
    );
    if (missing.length) {
      throw new Error("Answer every required question before completing this module.");
    }
    await db
      .prepare(
        `UPDATE module_progress SET status = 'complete', progress = 100,
         completed_at = ?, updated_at = ? WHERE member_id = ? AND module_key = ?`,
      )
      .bind(now, now, profile.id, programModule.key)
      .run();
    const updatedCompleted = [...new Set([...completed, programModule.key])];
    const next = nextModule(updatedCompleted);
    await db
      .prepare(
        "UPDATE member_profiles SET current_module = ?, updated_at = ? WHERE id = ?",
      )
      .bind(next.key, now, profile.id)
      .run();
    const assembled = await persistAssembledProfile(profile.id);
    const identityNotice =
      programModule.key === "A3" && assembled.identity
        ? ` Your provisional Core Identity is ${assembled.identity.archetype.name}.`
        : programModule.key === "B4" && assembled.identity
          ? ` Your Core Identity is locked: ${assembled.identity.archetype.name}.`
          : "";
    await db
      .prepare(
        `INSERT INTO notifications
         (member_id, title, body, is_read, created_at) VALUES (?, ?, ?, 0, ?)`,
      )
      .bind(
        profile.id,
        `${programModule.deliverable} ready`,
        `${next.title} is ready when you are.${identityNotice}`,
        now,
      )
      .run();
  } else if (payload.action === "save_profile") {
    await db
      .prepare(
        `UPDATE member_profiles SET display_name = ?, professional_title = ?,
         bio = ?, updated_at = ? WHERE id = ?`,
      )
      .bind(
        payload.displayName?.trim() || profile.display_name,
        payload.professionalTitle?.trim() ?? "",
        payload.bio?.trim() ?? "",
        now,
        profile.id,
      )
      .run();
  } else if (payload.action === "add_plan_item") {
    const title = payload.title?.trim() ?? "";
    if (!title) throw new Error("A plan item needs a title.");
    const position = await db
      .prepare(
        "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM action_plan_items WHERE member_id = ?",
      )
      .bind(profile.id)
      .first<{ next: number }>();
    await db
      .prepare(
        `INSERT INTO action_plan_items
         (member_id, title, due_date, status, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, 'open', ?, ?, ?)`,
      )
      .bind(
        profile.id,
        title,
        payload.dueDate?.trim() ?? "",
        position?.next ?? 0,
        now,
        now,
      )
      .run();
  } else if (payload.action === "toggle_plan_item") {
    await db
      .prepare(
        `UPDATE action_plan_items SET status = ?, updated_at = ?
         WHERE id = ? AND member_id = ?`,
      )
      .bind(
        payload.status === "complete" ? "complete" : "open",
        now,
        payload.id,
        profile.id,
      )
      .run();
  } else if (payload.action === "delete_plan_item") {
    await db
      .prepare("DELETE FROM action_plan_items WHERE id = ? AND member_id = ?")
      .bind(payload.id, profile.id)
      .run();
  } else if (payload.action === "save_settings") {
    await db
      .prepare(
        `UPDATE member_settings SET module_reminders = ?, message_notifications = ?,
         community_notifications = ?, updated_at = ? WHERE member_id = ?`,
      )
      .bind(
        payload.moduleReminders ? 1 : 0,
        payload.messageNotifications ? 1 : 0,
        payload.communityNotifications ? 1 : 0,
        now,
        profile.id,
      )
      .run();
  } else if (payload.action === "create_post") {
    const body = payload.body?.trim() ?? "";
    if (!body) throw new Error("Write something before posting.");
    await db
      .prepare(
        `INSERT INTO community_posts
         (member_id, author_name, body, created_at) VALUES (?, ?, ?, ?)`,
      )
      .bind(profile.id, profile.display_name, body, now)
      .run();
  } else if (payload.action === "send_message") {
    const body = payload.body?.trim() ?? "";
    if (!body) throw new Error("Write a message before sending.");
    await db
      .prepare(
        `INSERT INTO messages
         (member_id, sender, body, created_at) VALUES (?, 'member', ?, ?)`,
      )
      .bind(profile.id, body, now)
      .run();
  } else if (payload.action === "mark_notifications_read") {
    await db
      .prepare("UPDATE notifications SET is_read = 1 WHERE member_id = ?")
      .bind(profile.id)
      .run();
  } else {
    throw new Error("Unsupported member action.");
  }

  return getMemberData(email, preferredName);
}
