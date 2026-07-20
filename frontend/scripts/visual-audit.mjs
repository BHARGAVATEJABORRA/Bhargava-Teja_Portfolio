// Ad-hoc visual audit of the three footer defects against the LIVE dev server
// (localhost:3000). Drives scroll with real wheel events through Lenis and
// samples rendered pixels from screenshots. Not part of the CI gate.
//
//   node scripts/visual-audit.mjs
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.AUDIT_URL ?? "http://localhost:3000";
const OUT = new URL("../test-results/visual-audit/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: "domcontentloaded" });

// Dismiss the entrance curtain.
await page.waitForFunction(() => document.querySelector("#main-content, [role='dialog']") !== null, undefined, { timeout: 60_000 });
for (let i = 0; i < 20; i += 1) {
  if (await page.locator("#main-content").count()) break;
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
}
await page.waitForSelector(".adaline-footer-scene", { timeout: 30_000 });
await page.waitForTimeout(1200);

const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

// Real wheel events so Lenis drives the scroll exactly like a user.
async function wheelTo(target) {
  await page.mouse.move(720, 450);
  for (let i = 0; i < 400; i += 1) {
    const y = await page.evaluate(() => window.scrollY);
    const delta = target - y;
    if (Math.abs(delta) < 4) break;
    await page.mouse.wheel(0, Math.max(-1500, Math.min(1500, delta)));
    await page.waitForTimeout(60);
  }
  // Let Lenis finish easing.
  await page.waitForTimeout(900);
  return page.evaluate(() => window.scrollY);
}

async function samplePixels(shotBuffer, points) {
  return page.evaluate(
    async ({ dataUrl, points }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      return points.map(([x, y]) => {
        const d = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
        return [d[0], d[1], d[2]];
      });
    },
    { dataUrl: `data:image/png;base64,${shotBuffer.toString("base64")}`, points },
  );
}

const report = {};

// ---- CTA / aurora -----------------------------------------------------------
const ctaY = await wheelTo(Math.round(maxScroll * 0.92));
const ctaShot = await page.screenshot();
writeFileSync(`${OUT}cta.png`, ctaShot);
report.ctaScrollY = { target: Math.round(maxScroll * 0.92), actual: ctaY };
report.ctaSky = await samplePixels(ctaShot, [
  [1440 * 0.18, 900 * 0.62], // mid-left, lower third — must read clear green
  [1440 * 0.25, 900 * 0.72],
  [1440 * 0.5, 900 * 0.55], // centre — darker
  [1440 * 0.8, 900 * 0.7], // right column — softer green
  [1440 * 0.5, 900 * 0.12], // top of sky — should stay near-black
]);

// ---- shooting stars: watch meteor opacities for 15s --------------------------
const meteorTrace = [];
for (let t = 0; t < 30; t += 1) {
  meteorTrace.push(
    await page.evaluate(() =>
      [...document.querySelectorAll("[data-scroll-scene='cta-shooting-stars'] .adaline-meteor")].map(
        (m) => Math.round(Number(getComputedStyle(m).opacity) * 100) / 100,
      ),
    ),
  );
  await page.waitForTimeout(500);
}
report.meteorTrace = meteorTrace;
report.meteorVisibleTicks = meteorTrace.filter((frame) => frame.some((o) => o > 0.1)).length;

// ---- dock -------------------------------------------------------------------
const dockY = await wheelTo(maxScroll);
report.dockScrollY = { target: maxScroll, actual: dockY };
report.dockProgress = await page.evaluate(
  () => document.querySelector("[data-scroll-scene='dock-three']")?.dataset.dockProgress ?? null,
);
const dockShot = await page.screenshot();
writeFileSync(`${OUT}dock.png`, dockShot);

// Sample along the walkway: left / middle / right pools and the dark gaps (plane is
// 200vw centred; uv_x -> screen_x = (-0.5 + 2 * uv_x) * vw).
const dockRect = await page.evaluate(() => {
  const el = document.querySelector("[data-scroll-scene='dock-three']");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
});
report.dockRect = dockRect;
if (dockRect) {
  const walkwayY = dockRect.top + dockRect.height * (1 - 0.795);
  const xFor = (uv) => dockRect.left + dockRect.width * uv;
  report.dockWalkway = await samplePixels(dockShot, [
    [xFor(0.135), walkwayY], // left lamp — must match the two original pools
    [xFor(0.355), walkwayY], // under lamp 1 — warm pool
    [xFor(0.465), walkwayY], // mid-deck — must stay dark
    [xFor(0.575), walkwayY], // under lamp 2 — warm pool
    [xFor(0.27), dockRect.top + dockRect.height * (1 - 0.4)], // pier mid — beam used to be here
  ]);
}

writeFileSync(`${OUT}report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
