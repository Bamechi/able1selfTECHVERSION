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

export const memberAccounts = sqliteTable(
  "member_accounts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull().unique(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    passwordIterations: integer("password_iterations").notNull(),
    role: text("role").notNull().default("member"),
    status: text("status").notNull().default("active"),
    forcePasswordReset: integer("force_password_reset", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("idx_member_accounts_status").on(table.status)],
);

export const inviteCodes = sqliteTable(
  "invite_codes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    codeHash: text("code_hash").notNull().unique(),
    email: text("email"),
    role: text("role").notNull().default("member"),
    comped: integer("comped", { mode: "boolean" }).notNull().default(false),
    maxUses: integer("max_uses").notNull().default(1),
    uses: integer("uses").notNull().default(0),
    expiresAt: text("expires_at"),
    redeemedAt: text("redeemed_at"),
    redeemedBy: text("redeemed_by"),
    createdBy: text("created_by").notNull().default("system"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_invite_codes_email").on(table.email),
    index("idx_invite_codes_expiry").on(table.expiresAt),
  ],
);

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
    why: text("why").notNull().default(""),
    successMetric: text("success_metric").notNull().default(""),
    startDate: text("start_date").notNull().default(""),
    dueDate: text("due_date").notNull().default(""),
    checkinCadence: text("checkin_cadence").notNull().default("weekly"),
    status: text("status").notNull().default("open"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_action_plan_items_member").on(table.memberId, table.sortOrder),
  ],
);

export const planCheckins = sqliteTable(
  "plan_checkins",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull(),
    planItemId: integer("plan_item_id").notNull(),
    checkpointDate: text("checkpoint_date").notNull(),
    status: text("status").notNull(),
    explanation: text("explanation").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_plan_checkins_member_item").on(
      table.memberId,
      table.planItemId,
      table.checkpointDate,
    ),
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

export const identityResults = sqliteTable("identity_results", {
  memberId: integer("member_id").primaryKey(),
  code: text("code").notNull(),
  archetypeName: text("archetype_name").notNull(),
  provisional: integer("provisional", { mode: "boolean" })
    .notNull()
    .default(true),
  confidence: integer("confidence").notNull().default(0),
  axesJson: text("axes_json").notNull().default("[]"),
  styleArchetype: text("style_archetype").notNull().default(""),
  paletteJson: text("palette_json").notNull().default("{}"),
  energyJson: text("energy_json").notNull().default("{}"),
  incomeStreamsJson: text("income_streams_json").notNull().default("[]"),
  brandStatement: text("brand_statement").notNull().default(""),
  engineVersion: text("engine_version").notNull().default("2.0"),
  computedAt: text("computed_at").notNull(),
});

export const memberBirthData = sqliteTable("member_birth_data", {
  memberId: integer("member_id").primaryKey(),
  fullBirthName: text("full_birth_name").notNull().default(""),
  birthDate: text("birth_date").notNull().default(""),
  birthTime: text("birth_time").notNull().default(""),
  birthCity: text("birth_city").notNull().default(""),
  birthState: text("birth_state").notNull().default(""),
  birthCountry: text("birth_country").notNull().default(""),
  latitude: text("latitude").notNull().default(""),
  longitude: text("longitude").notNull().default(""),
  timezone: text("timezone").notNull().default(""),
  chartJson: text("chart_json").notNull().default("{}"),
  sunSign: text("sun_sign").notNull().default(""),
  moonSign: text("moon_sign").notNull().default(""),
  risingSign: text("rising_sign").notNull().default(""),
  ephemerisStatus: text("ephemeris_status")
    .notNull()
    .default("pending"),
  updatedAt: text("updated_at").notNull(),
});

export const clientProfiles = sqliteTable("client_profiles", {
  memberId: integer("member_id").primaryKey(),
  phone: text("phone").notNull().default(""),
  preferredName: text("preferred_name").notNull().default(""),
  shippingAddress: text("shipping_address").notNull().default(""),
  calendlyUrl: text("calendly_url").notNull().default(""),
  stylistNotes: text("stylist_notes").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
});

export const measurementSets = sqliteTable(
  "measurement_sets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull(),
    label: text("label").notNull().default("Current"),
    measuredAt: text("measured_at").notNull().default(""),
    measuredBy: text("measured_by").notNull().default(""),
    unit: text("unit").notNull().default("in"),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("idx_measurement_sets_member").on(table.memberId, table.updatedAt)],
);

export const measurements = sqliteTable(
  "measurements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    setId: integer("set_id").notNull(),
    measurementKey: text("measurement_key").notNull(),
    value: text("value").notNull().default(""),
  },
  (table) => [uniqueIndex("idx_measurements_set_key").on(table.setId, table.measurementKey)],
);

export const clientAssets = sqliteTable(
  "client_assets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull(),
    category: text("category").notNull(),
    objectKey: text("object_key").notNull().unique(),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull().default(0),
    caption: text("caption").notNull().default(""),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_client_assets_member").on(table.memberId, table.category)],
);

export const appointments = sqliteTable(
  "appointments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull(),
    title: text("title").notNull(),
    startsAt: text("starts_at").notNull(),
    status: text("status").notNull().default("scheduled"),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("idx_appointments_member").on(table.memberId, table.startsAt)],
);

export const clientOrders = sqliteTable(
  "client_orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull(),
    orderNumber: text("order_number").notNull(),
    title: text("title").notNull(),
    status: text("status").notNull().default("planning"),
    amount: text("amount").notNull().default(""),
    trackingUrl: text("tracking_url").notNull().default(""),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("idx_client_orders_member").on(table.memberId, table.updatedAt)],
);

export const adminAuditLog = sqliteTable(
  "admin_audit_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actorEmail: text("actor_email").notNull(),
    memberId: integer("member_id").notNull(),
    action: text("action").notNull(),
    detailJson: text("detail_json").notNull().default("{}"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_admin_audit_member").on(table.memberId, table.createdAt)],
);

export const profileSections = sqliteTable(
  "profile_sections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull(),
    sectionKey: text("section_key").notNull(),
    moduleKey: text("module_key").notNull(),
    stage: text("stage").notNull(),
    title: text("title").notNull(),
    locked: integer("locked", { mode: "boolean" }).notNull().default(true),
    contentJson: text("content_json").notNull().default("{}"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_profile_sections_member_section").on(
      table.memberId,
      table.sectionKey,
    ),
  ],
);

export const profileSynthesis = sqliteTable("profile_synthesis", {
  memberId: integer("member_id").primaryKey(),
  narrative: text("narrative").notNull().default(""),
  reviewStatus: text("review_status").notNull().default("ai_generated"),
  reviewedBy: text("reviewed_by").notNull().default(""),
  reviewedAt: text("reviewed_at"),
  shareEnabled: integer("share_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  shareToken: text("share_token").notNull().default(""),
  generatedAt: text("generated_at").notNull(),
});

export const partnerMatches = sqliteTable(
  "partner_matches",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull(),
    candidateId: integer("candidate_id").notNull(),
    score: integer("score").notNull().default(0),
    reasonJson: text("reason_json").notNull().default("{}"),
    status: text("status").notNull().default("suggested"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_partner_matches_pair").on(
      table.memberId,
      table.candidateId,
    ),
    index("idx_partner_matches_member_score").on(
      table.memberId,
      table.score,
    ),
  ],
);

export const guideMessages = sqliteTable(
  "guide_messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull(),
    role: text("role").notNull(),
    body: text("body").notNull(),
    groundedOnEngineVersion: text("grounded_on_engine_version")
      .notNull()
      .default("2.0"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_guide_messages_member_created").on(
      table.memberId,
      table.createdAt,
    ),
  ],
);

export const nudgeLog = sqliteTable(
  "nudge_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull(),
    nudgeType: text("nudge_type").notNull(),
    channel: text("channel").notNull(),
    sentAt: text("sent_at").notNull(),
    openedAt: text("opened_at"),
    convertedAt: text("converted_at"),
  },
  (table) => [
    index("idx_nudge_log_member_sent").on(table.memberId, table.sentAt),
  ],
);
