// Visual + numeric evidence capture for the adaline footer cinematic.
// Wheel-driven screenshots at the five report stages, composite RGB samples
// per phase (top-6% / middle / bottom-6%, like the adaline ground-truth
// table), and aurora pixel sums proving the night-only rule.
// Server must already be running on :3211 (production build).
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = "tests/scroll/__output__/stages";
mkdirSync(OUT, { recursive: true });

// Ground truth measured on the live adaline.ai scroll (top/mid/bottom RGB).
const ADALINE_TABLE = [
  ["sunset-onset", [116, 123, 152], [185, 170, 164], [220, 185, 138]],
  ["full-sunset", [97, 97, 134], [174, 151, 151], [212, 172, 129]],
  ["dusk", [72, 67, 93], [146, 121, 125], [196, 153, 116]],
  ["night+aurora", [17, 28, 31], [19, 50, 54], [10, 18, 18]],
  ["dock-end", [16, 25, 28], [2, 12, 13], [3, 13, 15]],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3211/", { waitUntil: "domcontentloaded" });

// Dismiss the entrance curtain (any keydown completes it) and wait for content.
await page.waitForFunction(() => document.querySelector("#main-content, [role='dialog']") !== null, undefined, { timeout: 60_000 });
for (let i = 0; i < 20; i += 1) {
  if (await page.locator("#main-content").count()) break;
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
}
await page.waitForSelector("#main-content", { timeout: 30_000 });
await page.waitForSelector(".adaline-footer-scene", { timeout: 30_000 });
await page.waitForTimeout(1500); // lazy images / Lenis resize timers

const { maxScroll, blogsTop, blogsBottom } = await page.evaluate(() => {
  const r = document.querySelector("#blogs").getBoundingClientRect();
  return {
    maxScroll: document.documentElement.scrollHeight - innerHeight,
    blogsTop: Math.round(r.top + scrollY),
    blogsBottom: Math.round(r.bottom + scrollY),
  };
});

// Scroll offset that puts the sky band at progress p — the same mapping the
// painter uses (0 = band top at viewport bottom, 1 = band bottom at 35% vh).
async function yForBandProgress(p) {
  return page.evaluate((target) => {
    const band = document.querySelector('[data-scroll-scene="sky-band"]');
    const rect = band.getBoundingClientRect();
    const topDoc = rect.top + scrollY;
    return Math.round(topDoc - innerHeight + target * (0.65 * innerHeight + rect.height));
  }, p);
}

// Real wheel events so Lenis drives the scroll exactly as a user's trackpad would.
async function wheelTo(target) {
  await page.mouse.move(720, 450);
  for (let guard = 0; guard < 400; guard += 1) {
    const y = await page.evaluate(() => scrollY);
    const delta = target - y;
    if (Math.abs(delta) < 4) break;
    await page.mouse.wheel(0, Math.max(-1500, Math.min(1500, delta)));
    await page.waitForTimeout(50);
  }
  // Let Lenis easing + the canvas painters flush to a stable state.
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        let last = scrollY;
        let stable = 0;
        const tick = () => {
          stable = Math.abs(scrollY - last) < 0.5 ? stable + 1 : 0;
          last = scrollY;
          if (stable >= 6) requestAnimationFrame(() => requestAnimationFrame(resolve));
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
}

// Composite (screenshotted) RGB at top-6% / middle / bottom-6%, averaged over
// a small patch at x = 30% — clear of the nav pills, the contact card, and
// the dock lamps, so the patch reads the rendered sky like the adaline table.
async function compositeRgb() {
  const b64 = (await page.screenshot()).toString("base64");
  return page.evaluate(async (encoded) => {
    const img = new Image();
    img.src = `data:image/png;base64,${encoded}`;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    const at = (fy) => {
      const y = Math.min(img.height - 9, Math.round(img.height * fy));
      const data = context.getImageData(Math.round(img.width * 0.3) - 12, y, 24, 8).data;
      let r = 0;
      let g = 0;
      let b = 0;
      const n = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
    };
    return { top: at(0.06), middle: at(0.5), bottom: at(0.94) };
  }, b64);
}

// Raw sky-canvas pixels (pure gradient, no foreground/overlays) at the same
// three heights — the direct check of the painter against the table.
async function skyCanvasRgb() {
  return page.evaluate(() => {
    const sky = document.querySelector('[data-scroll-scene="sky-gradient"]');
    if (!(sky instanceof HTMLCanvasElement) || !sky.width) return null;
    const context = sky.getContext("2d");
    const at = (fy) => {
      const d = context.getImageData(Math.round(sky.width / 2), Math.min(sky.height - 1, Math.round(sky.height * fy)), 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    return { top: at(0.06), middle: at(0.5), bottom: at(0.94) };
  });
}

// Sparse pixel sum of the ambient aurora canvas (same probe as the tests).
async function auroraSum() {
  return page.evaluate(() => {
    const canvas = document.querySelector("[data-ambient-aurora] canvas");
    if (!canvas || canvas.width === 0) return null;
    const context = canvas.getContext("2d");
    const w = Math.min(canvas.width, 400);
    const h = Math.min(canvas.height, 400);
    const data = context.getImageData(0, 0, w, h).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 53) sum += data[i];
    return sum;
  });
}

// Wait (up to ~12s) for a shooting star to be mid-flight before a screenshot.
async function waitForMeteor() {
  try {
    await page.waitForFunction(
      () => [...document.querySelectorAll(".adaline-meteor")].some((m) => Number(getComputedStyle(m).opacity) > 0.05),
      undefined,
      { timeout: 12_000 },
    );
  } catch {
    console.warn("  (no meteor entered its visibility window — screenshot may lack a shooting star)");
  }
}

// ---------------------------------------------------------------------------
// 1) Phase color samples vs the adaline ground-truth table.
// ---------------------------------------------------------------------------
const phasePoints = [
  ["sunset-onset", await yForBandProgress(0.33)],
  ["full-sunset", await yForBandProgress(0.48)],
  ["dusk", await yForBandProgress(0.53)],
  ["night+aurora", Math.round(maxScroll * 0.92)],
  ["dock-end", maxScroll],
];

console.log("\n=== Phase RGB (rendered vs adaline ground truth) ===");
for (const [name, target] of phasePoints) {
  await wheelTo(target);
  await page.waitForTimeout(300);
  const { top, middle, bottom } = await compositeRgb();
  const sky = await skyCanvasRgb();
  const aurora = await auroraSum();
  const truth = ADALINE_TABLE.find(([t]) => t === name);
  console.log(`${name.padEnd(14)} y=${String(target).padStart(6)}  top=${top}  mid=${middle}  bot=${bottom}  auroraSum=${aurora}`);
  if (sky) {
    console.log(`${"".padEnd(14)} sky-canvas      top=${sky.top}  mid=${sky.middle}  bot=${sky.bottom}`);
  }
  if (truth) {
    console.log(`${"".padEnd(14)} target          top=${truth[1]}  mid=${truth[2]}  bot=${truth[3]}`);
  }
}

// ---------------------------------------------------------------------------
// 2) Aurora night-only proof: sum == 0 at five dawn→dusk points, > 0 at CTA.
// ---------------------------------------------------------------------------
console.log("\n=== Aurora pixel sums (must be 0 before night, > 0 at CTA) ===");
const auroraPoints = [
  ["hero", 0],
  ["body", Math.round(maxScroll * 0.25)],
  ["mid-page", Math.round(maxScroll * 0.45)],
  ["sunset", Math.round(maxScroll * 0.65)],
  ["dusk", Math.round(maxScroll * 0.78)],
  ["cta-night", Math.round(maxScroll * 0.92)],
  ["dock", maxScroll],
];
for (const [name, target] of auroraPoints) {
  await wheelTo(target);
  await page.waitForTimeout(250);
  const sum = await auroraSum();
  console.log(`${name.padEnd(10)} y=${String(target).padStart(6)}  auroraSum=${sum}`);
}

// ---------------------------------------------------------------------------
// 3) The five report screenshots.
// ---------------------------------------------------------------------------
const stages = [
  ["1-articles-dissolve", Math.round(blogsBottom - 900 * 0.85), false],
  ["2-full-sunset", await yForBandProgress(0.48), true],
  ["3-cta-night", Math.round(maxScroll * 0.92), false],
  ["4-dock-lamps", Math.round(maxScroll * 0.97), false],
  ["5-footer-settled", maxScroll, false],
];

console.log(`\n=== Screenshots (articles ${blogsTop}–${blogsBottom}, maxScroll ${maxScroll}) ===`);
for (const [name, target, needsMeteor] of stages) {
  await wheelTo(target);
  await page.waitForTimeout(400);
  if (needsMeteor) await waitForMeteor();
  const y = await page.evaluate(() => scrollY);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`${name}: target=${target} actual=${Math.round(y)} (progress ${(y / maxScroll).toFixed(3)})`);
}

await browser.close();
console.log(`done -> ${OUT}`);
