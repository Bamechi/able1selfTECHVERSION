import assert from "node:assert/strict";
import { createHash, pbkdf2Sync } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const TEST_PASSWORDS = new Map([
  ["amechi@addcolormedia.com", "vanta"],
  ["shawndaniels2015@gmail.com", "vanta"],
  ["19keys@19keys.com", "vanta"],
]);

function passwordRecord(email, name, role = "member") {
  const password = TEST_PASSWORDS.get(email);
  const salt = Buffer.from(`able1self:${email}`).subarray(0, 16);
  return {
    email,
    display_name: name,
    password_hash: pbkdf2Sync(password, salt, 100_000, 32, "sha256").toString(
      "base64url",
    ),
    password_salt: salt.toString("base64url"),
    password_iterations: 100_000,
    role,
    status: "active",
    force_password_reset: 1,
  };
}

function createAuthDatabase() {
  const accounts = new Map([
    [
      "amechi@addcolormedia.com",
      passwordRecord("amechi@addcolormedia.com", "Amechi", "admin"),
    ],
    [
      "shawndaniels2015@gmail.com",
      passwordRecord("shawndaniels2015@gmail.com", "Shawn Daniels"),
    ],
    ["19keys@19keys.com", passwordRecord("19keys@19keys.com", "19Keys")],
  ]);
  const inviteCode = "ABLE-COMP-TEST";
  const inviteHash = createHash("sha256")
    .update(inviteCode)
    .digest("base64url");
  const invites = new Map([
    [
      inviteHash,
      {
        id: 1,
        email: "invited@example.com",
        role: "member",
        max_uses: 1,
        uses: 0,
        expires_at: null,
      },
    ],
  ]);

  function prepare(sql) {
    let values = [];
    const statement = {
      bind(...args) {
        values = args;
        return statement;
      },
      async first() {
        if (sql.includes("FROM member_accounts")) {
          const account = accounts.get(String(values[0]).toLowerCase());
          return account?.status === "active" ? account : null;
        }
        if (sql.includes("FROM invite_codes")) {
          return invites.get(String(values[0])) ?? null;
        }
        return null;
      },
      async run() {
        if (sql.includes("INSERT INTO member_accounts")) {
          const [email, displayName, hash, salt, iterations, role] = values;
          accounts.set(String(email), {
            email,
            display_name: displayName,
            password_hash: hash,
            password_salt: salt,
            password_iterations: iterations,
            role,
            status: "active",
            force_password_reset: 0,
          });
        }
        if (sql.includes("UPDATE invite_codes")) {
          const invite = [...invites.values()].find((item) => item.id === values[2]);
          if (invite) invite.uses += 1;
        }
        return { meta: { changes: 1 } };
      },
    };
    return statement;
  }

  return {
    prepare,
    async batch(statements) {
      return Promise.all(statements.map((statement) => statement.run()));
    },
  };
}

const authDatabase = createAuthDatabase();

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

function runtimeEnv() {
  return {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
    DB: authDatabase,
    AUTH_SESSION_SECRET: "test-session-secret-with-at-least-32-characters",
  };
}

function executionContext() {
  return {
    waitUntil() {},
    passThroughOnException() {},
  };
}

async function render() {
  const worker = await loadWorker();
  return worker.fetch(
    new Request("https://able1self.example/", {
      headers: {
        accept: "text/html",
        host: "able1self.example",
        "x-forwarded-host": "able1self.example",
        "x-forwarded-proto": "https",
      },
    }),
    runtimeEnv(),
    executionContext(),
  );
}

test("server-renders the finished Able1Self experience and metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>Able1Self — Know Yourself\. Build What Comes Next\.<\/title>/i,
  );
  assert.match(html, /Know yourself\./);
  assert.match(html, /Build what comes next\./);
  assert.match(html, /I’m building a business/);
  assert.match(html, /I’m building my career/);
  assert.match(html, /One system\./);
  assert.match(html, /Personalized Identity Profile/);
  assert.match(html, /The Room/);
  assert.match(html, /Shawn Daniels/);
  assert.match(html, /Member login/);
  assert.match(html, /able1self-logo\.png/);
  assert.match(html, /The transformation/);
  assert.match(html, /Starter/);
  assert.match(html, /Premium/);
  assert.match(html, /VIP/);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/able1self\.example\/og\.png"\/>/i,
  );
  assert.match(html, /<link rel="icon" href="\/able1self-logo\.png"\/>/i);
  assert.doesNotMatch(
    html,
    /dress the part|self-awareness becomes a wardrobe|style archetype/i,
  );
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|SkeletonPreview/i);
});

test("ships the app-like system, real founder image, and accessible fallbacks", async () => {
  const [page, memberExperience, css, revisionCss, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/member-experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/revision.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /IntersectionObserver/);
  assert.match(page, /IntroSequence/);
  assert.match(page, /3200/);
  assert.match(page, /useState<Audience>/);
  assert.match(page, /\/api\/auth\/session/);
  assert.match(page, /window\.location\.assign\("\/member"\)/);
  assert.match(memberExperience, /Forgot password\?/);
  assert.match(memberExperience, /The ABLE Program/);
  assert.match(memberExperience, /Personalized Identity Profile/i);
  assert.match(memberExperience, /Accountability/);
  assert.match(page, /role="tablist"/);
  assert.match(page, /aria-label="Toggle navigation"/);
  assert.match(page, /shawn-daniels\.webp/);
  assert.equal(page.match(/shawn-daniels\.webp/g)?.length, 1);
  assert.match(page, /shawn-profile\.jpg/);
  assert.doesNotMatch(page, /<canvas|FRAME_COUNT|requestAnimationFrame|\/frames\//);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /font-family:\s*"Manrope"/);
  assert.match(revisionCss, /\.founder-portrait img[\s\S]*grayscale\(1\)/);
  assert.match(
    revisionCss,
    /\.module-player > main[\s\S]*overflow-y:\s*scroll/,
  );
  assert.match(revisionCss, /scrollbar-gutter:\s*stable/);
  assert.match(revisionCss, /\.assessment-options button[\s\S]*font-size:\s*16px/);
  assert.match(layout, /x-forwarded-host/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await Promise.all([
    access(new URL("../public/og.png", import.meta.url)),
    access(new URL("../public/able1self-logo.png", import.meta.url)),
    access(new URL("../public/images/shawn-daniels.webp", import.meta.url)),
    access(new URL("../public/images/shawn-profile.jpg", import.meta.url)),
    access(new URL("../public/fonts/manrope.woff2", import.meta.url)),
  ]);
});

test("accepts seeded accounts and rejects shared or invalid credentials", async () => {
  const worker = await loadWorker();
  const request = (email, password) =>
    new Request("https://able1self.example/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password,
      }),
    });

  const accepted = await worker.fetch(
    request(
      "amechi@addcolormedia.com",
      TEST_PASSWORDS.get("amechi@addcolormedia.com"),
    ),
    runtimeEnv(),
    executionContext(),
  );
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).ok, true);
  const setCookie = accepted.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /able1self_session=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);

  const session = await worker.fetch(
    new Request("https://able1self.example/api/auth/session", {
      headers: { cookie: setCookie.split(";")[0] },
    }),
    runtimeEnv(),
    executionContext(),
  );
  assert.equal(session.status, 200);
  const sessionData = await session.json();
  assert.equal(sessionData.authenticated, true);
  assert.equal(sessionData.user.email, "amechi@addcolormedia.com");

  for (const [email, name] of [
    ["shawndaniels2015@gmail.com", "Shawn Daniels"],
    ["19keys@19keys.com", "19Keys"],
  ]) {
    const accountResponse = await worker.fetch(
      request(email, TEST_PASSWORDS.get(email)),
      runtimeEnv(),
      executionContext(),
    );
    assert.equal(accountResponse.status, 200);
    const accountData = await accountResponse.json();
    assert.equal(accountData.user.email, email);
    assert.equal(accountData.user.name, name);
  }

  const logout = await worker.fetch(
    new Request("https://able1self.example/api/auth/logout", {
      method: "POST",
      headers: { cookie: setCookie.split(";")[0] },
    }),
    runtimeEnv(),
    executionContext(),
  );
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/i);

  const rejected = await worker.fetch(
    request("amechi@addcolormedia.com", "incorrect"),
    runtimeEnv(),
    executionContext(),
  );
  assert.equal(rejected.status, 401);
  assert.equal((await rejected.json()).ok, false);

  const sharedAccess = await worker.fetch(
    request("fresh.member@example.com", "former-shared-password"),
    runtimeEnv(),
    executionContext(),
  );
  assert.equal(sharedAccess.status, 401);
  assert.equal((await sharedAccess.json()).ok, false);

  const outsider = await worker.fetch(
    request("outsider@example.com", "vanta"),
    runtimeEnv(),
    executionContext(),
  );
  assert.equal(outsider.status, 401);
  assert.equal((await outsider.json()).ok, false);
});

test("ships all revision batches and the standalone private client portal", async () => {
  const [program, identity, astrology, lifePaths, signal, ledger, memberPage, portalStore, uploadRoute, adminRoute, migration, planMigration, conciergeMigration, revisionCss, hosting] = await Promise.all([
    readFile(new URL("../lib/program-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/identity-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/astrology-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/life-paths.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/brand-signal.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/brand-ledger.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/member/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/client-portal-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/client-portal/upload/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/client-portal/admin/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0004_member_portal_revision.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0005_plan_accountability.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0006_client_concierge_app.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/revision.css", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);
  assert.match(program, /THE QUESTION BANK — 14 MODULES/);
  assert.match(program, /key: "B0"/);
  assert.match(program, /key: "B4"/);
  assert.doesNotMatch(program, /key: "a2_element"/);
  assert.match(identity, /a2_derived_element/);
  assert.match(astrology, /system: "tropical"/);
  assert.match(astrology, /degree < 1 \|\| degree > 29/);
  assert.match(lifePaths, /8: \{ title: "The Executive"/);
  assert.equal((signal.match(/primaryAxis:/g) ?? []).length, 17);
  assert.match(ledger, /slice\(0,3\)/);
  assert.match(memberPage, /Find and verify location/);
  assert.match(memberPage, /Members Only/);
  assert.match(memberPage, /Admin console/);
  assert.match(memberPage, /Return to ABLE program/);
  assert.match(memberPage, /Design board\./);
  assert.match(memberPage, /Change profile photo/);
  assert.match(memberPage, /update_order/);
  assert.match(memberPage, /if \(view === "client"/);
  assert.match(memberPage, /add_plan_checkin/);
  assert.match(memberPage, /on_track/);
  assert.match(memberPage, /off_track/);
  assert.equal((portalStore.match(/\["[a-z_]+", "[A-Za-z ]+"\]/g) ?? []).length, 22);
  assert.match(adminRoute, /role !== "admin"/);
  assert.match(migration, /CREATE TABLE `admin_audit_log`/);
  assert.match(migration, /role` = 'admin'[\s\S]*shawndaniels2015@gmail\.com|shawndaniels2015@gmail\.com[\s\S]*role` = 'admin'/);
  assert.match(planMigration, /CREATE TABLE `plan_checkins`/);
  assert.match(planMigration, /`explanation` text NOT NULL/);
  assert.match(conciergeMigration, /ADD `board_title`/);
  assert.match(conciergeMigration, /ADD `next_delivery`/);
  assert.match(uploadRoute, /boardTitle/);
  assert.match(portalStore, /update_order/);
  assert.match(revisionCss, /firm type floor/);
  assert.match(revisionCss, /portal-sidebar nav button \{ font-size: 15px !important/);
  assert.match(revisionCss, /Standalone Members Only client app/);
  assert.match(hosting, /"r2": "MEMBER_UPLOADS"/);
});

test("requires and redeems a valid invite code for account creation", async () => {
  const worker = await loadWorker();
  const request = (inviteCode) =>
    new Request("https://able1self.example/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        inviteCode,
        email: "invited@example.com",
        name: "Invited Member",
        password: "invited-member-password",
      }),
    });

  const blocked = await worker.fetch(
    request(""),
    runtimeEnv(),
    executionContext(),
  );
  assert.equal(blocked.status, 400);

  const redeemed = await worker.fetch(
    request("ABLE-COMP-TEST"),
    runtimeEnv(),
    executionContext(),
  );
  assert.equal(redeemed.status, 200);
  assert.equal((await redeemed.json()).authenticated, true);

  const replayed = await worker.fetch(
    request("ABLE-COMP-TEST"),
    runtimeEnv(),
    executionContext(),
  );
  assert.notEqual(replayed.status, 200);
});

test("forgot-password endpoint accepts a valid reset request", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("https://able1self.example/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "amechi@addcolormedia.com" }),
    }),
    runtimeEnv(),
    executionContext(),
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});

test("ships the complete portal engine, persistent results, and D1 schema", async () => {
  const [
    memberPage,
    store,
    programData,
    identityEngine,
    schema,
    baseMigration,
    engineMigration,
    authMigration,
    accountStore,
    hosting,
  ] = await Promise.all([
    readFile(new URL("../app/member/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/member-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/program-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/identity-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../drizzle/0000_jittery_red_hulk.sql", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../drizzle/0001_dazzling_ikaris.sql", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../drizzle/0002_complex_mister_fear.sql", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../lib/account-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);

  assert.match(memberPage, /THE ABLE PROGRAM/);
  assert.match(memberPage, /PERSONALIZED IDENTITY PROFILE/);
  assert.match(memberPage, /Your 90-day plan/);
  assert.match(memberPage, /THE ROOM/);
  assert.match(memberPage, /ACCOUNTABILITY/);
  assert.match(memberPage, /save_response/);
  assert.match(memberPage, /complete_module/);
  assert.match(memberPage, /CORE IDENTITY/);
  assert.match(memberPage, /AI GUIDE/);
  assert.match(memberPage, /Revisit key questions/);
  assert.match(memberPage, /PROFILE IN PROGRESS/);
  assert.equal(
    (programData.match(/scoring: "(?:SCORED|FLAVOR|DERIVED)"/g) ?? []).length,
    76,
  );
  assert.match(programData, /title: "Define Your Image"/);
  assert.match(identityEngine, /export const ARCHETYPES/);
  assert.match(identityEngine, /export function assembleProfile/);
  assert.match(store, /ON CONFLICT\(member_id, question_key\)/);
  assert.match(store, /ON CONFLICT\(member_id, module_key\) DO UPDATE SET/);
  assert.match(store, /persistAssembledProfile/);
  assert.match(store, /mark_notifications_read/);
  assert.match(store, /displayNameFromEmail/);
  assert.doesNotMatch(store, /CREATE TABLE|ensureSchema|schemaStatements/);
  assert.match(schema, /surveyResponses/);
  assert.match(schema, /identityResults/);
  assert.match(schema, /profileSections/);
  assert.match(schema, /memberAccounts/);
  assert.match(schema, /inviteCodes/);
  assert.match(baseMigration, /CREATE TABLE `survey_responses`/);
  assert.match(engineMigration, /CREATE TABLE `identity_results`/);
  assert.match(engineMigration, /CREATE TABLE `profile_sections`/);
  assert.match(authMigration, /CREATE TABLE `member_accounts`/);
  assert.match(authMigration, /CREATE TABLE `invite_codes`/);
  assert.match(authMigration, /password_hash/);
  assert.doesNotMatch(authMigration, /former-shared-password/i);
  assert.match(accountStore, /verifyPassword/);
  assert.match(accountStore, /status = 'active'/);
  assert.equal(JSON.parse(hosting).d1, "DB");
});
