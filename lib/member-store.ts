import { getD1 } from "./runtime";
import { moduleMap, programModules } from "./program-data";

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

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS member_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL DEFAULT 'Amechi',
    professional_title TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    current_module TEXT NOT NULL DEFAULT 'A1',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS module_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    module_key TEXT NOT NULL,
    stage TEXT NOT NULL,
    module_order INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started',
    progress INTEGER NOT NULL DEFAULT 0,
    started_at TEXT,
    completed_at TEXT,
    updated_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_module_progress_member_module
   ON module_progress(member_id, module_key)`,
  `CREATE TABLE IF NOT EXISTS survey_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    module_key TEXT NOT NULL,
    question_key TEXT NOT NULL,
    answer TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_responses_member_question
   ON survey_responses(member_id, question_key)`,
  `CREATE TABLE IF NOT EXISTS action_plan_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    due_date TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'open',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_action_plan_items_member
   ON action_plan_items(member_id, sort_order)`,
  `CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_community_posts_member_created
   ON community_posts(member_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    sender TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_messages_member_created
   ON messages(member_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS member_settings (
    member_id INTEGER PRIMARY KEY,
    module_reminders INTEGER NOT NULL DEFAULT 1,
    message_notifications INTEGER NOT NULL DEFAULT 1,
    community_notifications INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_member_read
   ON notifications(member_id, is_read, created_at)`,
];

async function ensureSchema() {
  const db = getD1();
  await db.batch(
    schemaStatements.map((statement) => db.prepare(statement)),
  );
}

async function ensurePilot(email: string) {
  await ensureSchema();
  const db = getD1();
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT OR IGNORE INTO member_profiles
       (email, display_name, created_at, updated_at)
       VALUES (?, 'Amechi', ?, ?)`,
    )
    .bind(email, now, now)
    .run();

  const profile = await db
    .prepare("SELECT * FROM member_profiles WHERE email = ?")
    .bind(email)
    .first<ProfileRow>();
  if (!profile) throw new Error("Unable to initialize the pilot profile.");

  await db.batch(
    programModules.map((module) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO module_progress
           (member_id, module_key, stage, module_order, status, progress, updated_at)
           VALUES (?, ?, ?, ?, 'not_started', 0, ?)`,
        )
        .bind(profile.id, module.key, module.stage, module.order, now),
    ),
  );

  await db
    .prepare(
      `INSERT OR IGNORE INTO member_settings
       (member_id, module_reminders, message_notifications, community_notifications, updated_at)
       VALUES (?, 1, 1, 0, ?)`,
    )
    .bind(profile.id, now)
    .run();

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
          "Your pilot is ready",
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

function answerValue(responses: ResponseRow[], key: string) {
  return responses.find((response) => response.question_key === key)?.answer ?? "";
}

export async function getMemberData(email: string) {
  const profile = await ensurePilot(email);
  const db = getD1();
  const [
    progressResult,
    responsesResult,
    planResult,
    settings,
    postsResult,
    messagesResult,
    notificationsResult,
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
         FROM action_plan_items WHERE member_id = ?
         ORDER BY sort_order, id`,
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
        `SELECT id, author_name, body, created_at
         FROM community_posts WHERE member_id = ?
         ORDER BY created_at DESC LIMIT 30`,
      )
      .bind(profile.id)
      .all(),
    db
      .prepare(
        `SELECT id, sender, body, created_at
         FROM messages WHERE member_id = ?
         ORDER BY created_at ASC LIMIT 100`,
      )
      .bind(profile.id)
      .all(),
    db
      .prepare(
        `SELECT id, title, body, is_read, created_at
         FROM notifications WHERE member_id = ?
         ORDER BY created_at DESC LIMIT 30`,
      )
      .bind(profile.id)
      .all(),
  ]);

  const progress = progressResult.results;
  const responses = responsesResult.results;
  const overallProgress = Math.round(
    progress.reduce((sum, module) => sum + module.progress, 0) /
      Math.max(progress.length, 1),
  );
  const completedModules = progress.filter(
    (module) => module.status === "complete",
  ).length;
  const current =
    progress.find((module) => module.status !== "complete") ?? progress.at(-1);

  const profileStatement = [
    answerValue(responses, "B3_Q1"),
    answerValue(responses, "B3_Q2"),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    profile: {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      professionalTitle: profile.professional_title,
      bio: profile.bio,
      currentModule: current?.module_key ?? profile.current_module,
      overallProgress,
      completedModules,
    },
    progress,
    responses,
    plan: planResult.results,
    settings,
    posts: postsResult.results,
    messages: messagesResult.results,
    notifications: notificationsResult.results,
    insights: {
      workPattern: answerValue(responses, "A3_Q3") || "Still discovering",
      naturalValue:
        answerValue(responses, "A1_Q2") || "Complete A1 to reveal this signal",
      energySource:
        answerValue(responses, "A2_Q1") || "Complete A2 to map your energy",
      positioning:
        profileStatement || "Complete Brand to build your positioning statement",
      network:
        answerValue(responses, "L1_Q1") || "Complete L1 to map your network",
      direction:
        answerValue(responses, "E2_Q1") || "Complete E2 to set your 90-day outcome",
    },
  };
}

type MemberAction = {
  action?: string;
  moduleKey?: string;
  questionKey?: string;
  answer?: string;
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

export async function updateMemberData(email: string, payload: MemberAction) {
  const profile = await ensurePilot(email);
  const db = getD1();
  const now = new Date().toISOString();

  if (payload.action === "save_response") {
    const programModule = payload.moduleKey
      ? moduleMap[payload.moduleKey]
      : null;
    const question = programModule?.questions.find(
      (item) => item.key === payload.questionKey,
    );
    const answer = payload.answer?.trim() ?? "";
    if (!programModule || !question || !answer) {
      throw new Error("A valid module question and answer are required.");
    }
    await db
      .prepare(
        `INSERT INTO survey_responses
         (member_id, module_key, question_key, answer, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(member_id, question_key)
         DO UPDATE SET answer = excluded.answer, updated_at = excluded.updated_at`,
      )
      .bind(profile.id, programModule.key, question.key, answer, now)
      .run();
    const answered = await db
      .prepare(
        `SELECT COUNT(*) AS count FROM survey_responses
         WHERE member_id = ? AND module_key = ?`,
      )
      .bind(profile.id, programModule.key)
      .first<{ count: number }>();
    const progress = Math.min(
      95,
      Math.round(
        ((answered?.count ?? 0) / programModule.questions.length) * 90,
      ),
    );
    await db
      .prepare(
        `UPDATE module_progress
         SET status = CASE WHEN status = 'complete' THEN status ELSE 'in_progress' END,
             progress = CASE WHEN status = 'complete' THEN 100 ELSE ? END,
             started_at = COALESCE(started_at, ?),
             updated_at = ?
         WHERE member_id = ? AND module_key = ?`,
      )
      .bind(progress, now, now, profile.id, programModule.key)
      .run();
    await db
      .prepare(
        "UPDATE member_profiles SET current_module = ?, updated_at = ? WHERE id = ?",
      )
      .bind(programModule.key, now, profile.id)
      .run();
  } else if (payload.action === "complete_module") {
    const programModule = payload.moduleKey
      ? moduleMap[payload.moduleKey]
      : null;
    if (!programModule) throw new Error("A valid module is required.");
    const answered = await db
      .prepare(
        `SELECT COUNT(*) AS count FROM survey_responses
         WHERE member_id = ? AND module_key = ?`,
      )
      .bind(profile.id, programModule.key)
      .first<{ count: number }>();
    if ((answered?.count ?? 0) < programModule.questions.length) {
      throw new Error("Answer every question before completing this module.");
    }
    await db
      .prepare(
        `UPDATE module_progress
         SET status = 'complete', progress = 100, completed_at = ?, updated_at = ?
         WHERE member_id = ? AND module_key = ?`,
      )
      .bind(now, now, profile.id, programModule.key)
      .run();
    const next = programModules.find(
      (item) => item.order === programModule.order + 1,
    );
    if (next) {
      await db
        .prepare(
          "UPDATE member_profiles SET current_module = ?, updated_at = ? WHERE id = ?",
        )
        .bind(next.key, now, profile.id)
        .run();
    }
    await db
      .prepare(
        `INSERT INTO notifications
         (member_id, title, body, is_read, created_at)
         VALUES (?, ?, ?, 0, ?)`,
      )
      .bind(
        profile.id,
        `${programModule.title} complete`,
        next
          ? `${next.title} is ready when you are.`
          : "Your complete ABLE profile is ready.",
        now,
      )
      .run();
  } else if (payload.action === "save_profile") {
    await db
      .prepare(
        `UPDATE member_profiles
         SET display_name = ?, professional_title = ?, bio = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        payload.displayName?.trim() || "Amechi",
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
      .bind(payload.status === "complete" ? "complete" : "open", now, payload.id, profile.id)
      .run();
  } else if (payload.action === "delete_plan_item") {
    await db
      .prepare("DELETE FROM action_plan_items WHERE id = ? AND member_id = ?")
      .bind(payload.id, profile.id)
      .run();
  } else if (payload.action === "save_settings") {
    await db
      .prepare(
        `UPDATE member_settings
         SET module_reminders = ?, message_notifications = ?,
             community_notifications = ?, updated_at = ?
         WHERE member_id = ?`,
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

  return getMemberData(email);
}
