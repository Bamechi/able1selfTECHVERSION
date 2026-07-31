import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://able1self.example/", {
      headers: {
        accept: "text/html",
        host: "able1self.example",
        "x-forwarded-host": "able1self.example",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
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
  assert.match(html, /Starter/);
  assert.match(html, /Premium/);
  assert.match(html, /VIP/);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/able1self\.example\/og\.png"\/>/i,
  );
  assert.match(html, /<link rel="icon" href="\/favicon\.png"\/>/i);
  assert.doesNotMatch(
    html,
    /dress the part|self-awareness becomes a wardrobe|style archetype/i,
  );
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|SkeletonPreview/i);
});

test("ships the app-like system, real founder image, and accessible fallbacks", async () => {
  const [page, css, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /IntersectionObserver/);
  assert.match(page, /useState<Audience>/);
  assert.match(page, /role="tablist"/);
  assert.match(page, /aria-label="Toggle navigation"/);
  assert.match(page, /shawn-daniels\.webp/);
  assert.doesNotMatch(page, /<canvas|FRAME_COUNT|requestAnimationFrame|\/frames\//);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /font-family:\s*"Manrope"/);
  assert.match(layout, /x-forwarded-host/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await Promise.all([
    access(new URL("../public/og.png", import.meta.url)),
    access(new URL("../public/favicon.png", import.meta.url)),
    access(new URL("../public/images/shawn-daniels.webp", import.meta.url)),
    access(new URL("../public/fonts/manrope.woff2", import.meta.url)),
  ]);
});
