import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const memberProfiles = sqliteTable("member_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull().default("Amechi"),
  professionalTitle: text("professional_title").notNull().default(""),
  bio: text("bio").notNull().default(""),
  currentModule: text("current_module").notNull().default("A1"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const moduleProgress = sqliteTable(
  "module_progress",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull(),
    moduleKey: text("module_key").notNull(),
    stage: text("stage").notNull(),
    moduleOrder: integer("module_order").notNull(),
    status: text("status").notNull().default("not_started"),
    progress: integer("progress").notNull().default(0),
    startedAt: text("started_at"),
    completedAt: text("completed_at"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_module_progress_member_module").on(
      table.memberId,
      table.moduleKey,
    ),
  ],
);

export const surveyResponses = sqliteTable(
  "survey_responses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull(),
    moduleKey: text("module_key").notNull(),
    questionKey: text("question_key").notNull(),
    answer: text("answer").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_survey_responses_member_question").on(
      table.memberId,
      table.questionKey,
    ),
  ],
);

export const actionPlanItems = sqliteTable(
  "action_plan_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull(),
    title: text("title").notNull(),
    dueDate: text("due_date").notNull().default(""),
    status: text("status").notNull().default("open"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_action_plan_items_member").on(table.memberId, table.sortOrder),
  ],
);

export const communityPosts = sqliteTable(
  "community_posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull(),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_community_posts_member_created").on(
      table.memberId,
      table.createdAt,
    ),
  ],
);

export const messages = sqliteTable(
  "messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull(),
    sender: text("sender").notNull(),
    body: text("body").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_messages_member_created").on(table.memberId, table.createdAt),
  ],
);

export const memberSettings = sqliteTable("member_settings", {
  memberId: integer("member_id").primaryKey(),
  moduleReminders: integer("module_reminders", { mode: "boolean" })
    .notNull()
    .default(true),
  messageNotifications: integer("message_notifications", { mode: "boolean" })
    .notNull()
    .default(true),
  communityNotifications: integer("community_notifications", {
    mode: "boolean",
  })
    .notNull()
    .default(false),
  updatedAt: text("updated_at").notNull(),
});

export const notifications = sqliteTable(
  "notifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_notifications_member_read").on(
      table.memberId,
      table.isRead,
      table.createdAt,
    ),
  ],
);
