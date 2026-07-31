import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
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
    /<title>Able1Self — The Uniform of Personal Evolution<\/title>/i,
  );
  assert.match(html, /Discover who you are\./);
  assert.match(html, /Then dress the part\./);
  assert.match(html, /One framework\./);
  assert.match(html, /Personalized Identity Profile/);
  assert.match(html, /THE ROOM/);
  assert.match(html, /Starter/);
  assert.match(html, /Premium/);
  assert.match(html, /VIP/);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/able1self\.example\/og\.png"\/>/i,
  );
  assert.match(html, /<link rel="icon" href="\/favicon\.png"\/>/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|SkeletonPreview/i);
});

test("ships the cinematic media system and accessible fallbacks", async () => {
  const [page, css, layout, packageJson, frames] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readdir(new URL("../public/frames/", import.meta.url)),
  ]);

  assert.equal(frames.length, 160);
  assert.equal(frames[0], "hero_001.webp");
  assert.equal(frames.at(-1), "hero_160.webp");
  assert.match(page, /FRAME_COUNT = 160/);
  assert.match(page, /requestAnimationFrame/);
  assert.match(page, /IntersectionObserver/);
  assert.match(page, /aria-label="Toggle navigation"/);
  assert.match(page, /<details className="reveal"/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(layout, /x-forwarded-host/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await Promise.all([
    access(new URL("../public/og.png", import.meta.url)),
    access(new URL("../public/favicon.png", import.meta.url)),
    access(new URL("../public/images/founder.jpg", import.meta.url)),
    access(new URL("../public/fonts/bodoni-moda.woff2", import.meta.url)),
  ]);
});
