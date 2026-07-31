import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

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
    DEMO_LOGIN_EMAIL: "amechi@addcoloremdia.com",
    DEMO_LOGIN_PASSWORD: "test-preview-password",
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
  assert.match(html, /Log in/);
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
  const [page, memberExperience, css, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/member-experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /IntersectionObserver/);
  assert.match(page, /IntroSequence/);
  assert.match(page, /3200/);
  assert.match(page, /useState<Audience>/);
  assert.match(page, /able1self-preview-session/);
  assert.match(memberExperience, /Forgot password\?/);
  assert.match(memberExperience, /The ABLE Program/);
  assert.match(memberExperience, /Personalized Identity Profile/i);
  assert.match(memberExperience, /Accountability/);
  assert.match(page, /role="tablist"/);
  assert.match(page, /aria-label="Toggle navigation"/);
  assert.match(page, /shawn-daniels\.webp/);
  assert.equal(page.match(/shawn-daniels\.webp/g)?.length, 1);
  assert.doesNotMatch(page, /<canvas|FRAME_COUNT|requestAnimationFrame|\/frames\//);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /font-family:\s*"Manrope"/);
  assert.match(layout, /x-forwarded-host/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await Promise.all([
    access(new URL("../public/og.png", import.meta.url)),
    access(new URL("../public/able1self-logo.png", import.meta.url)),
    access(new URL("../public/images/shawn-daniels.webp", import.meta.url)),
    access(new URL("../public/fonts/manrope.woff2", import.meta.url)),
  ]);
});

test("accepts the configured preview account and rejects invalid credentials", async () => {
  const worker = await loadWorker();
  const request = (password) =>
    new Request("https://able1self.example/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "amechi@addcoloremdia.com",
        password,
      }),
    });

  const accepted = await worker.fetch(
    request("test-preview-password"),
    runtimeEnv(),
    executionContext(),
  );
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).ok, true);

  const rejected = await worker.fetch(
    request("incorrect"),
    runtimeEnv(),
    executionContext(),
  );
  assert.equal(rejected.status, 401);
  assert.equal((await rejected.json()).ok, false);
});

test("forgot-password endpoint accepts a valid reset request", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("https://able1self.example/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "amechi@addcoloremdia.com" }),
    }),
    runtimeEnv(),
    executionContext(),
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});
