import type { Page } from "@playwright/test";

/** Numeric snapshot of every scroll-linked footer/article layer. */
export interface LayerSample {
  scrollY: number;
  /** viewport-relative top of the in-flow starfield (moves 1:1 with scroll) */
  starsTop: number | null;
  starsOpacity: number | null;
  /** rgba pixels sampled from the hand-painted sky canvas (top/mid/bottom) */
  sky: number[] | null;
  /** rgba of the brightest streak pixel on three rows of the cloud canvas */
  clouds: number[] | null;
  /** computed transform matrix + opacity per article-deck ScrollStack wrapper
   *  (ScrollStack transforms the wrapper, not the inner .article-card) */
  cards: { transform: number[]; opacity: number }[];
}

const SAMPLE_FN = `(() => {
  const nums = (s) => (s && s !== "none" ? (s.match(/-?\\d+(?:\\.\\d+)?/g) || []).map(Number) : []);
  const q = (sel) => document.querySelector(sel);

  const stars = q('[data-scroll-scene="stars"]');
  const skyCanvas = q('[data-scroll-scene="sky-gradient"]');
  const cloudsCanvas = q('[data-scroll-scene="clouds"]');

  // RGB readback of near-transparent premultiplied pixels is quantization
  // noise, so report those as pure alpha.
  const pixel = (data, offset) =>
    data[offset + 3] < 8 ? [0, 0, 0, data[offset + 3]] : [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];

  let sky = null;
  if (skyCanvas instanceof HTMLCanvasElement && skyCanvas.width > 0) {
    const context = skyCanvas.getContext("2d");
    sky = [];
    for (const fy of [0.05, 0.5, 0.95]) {
      const y = Math.min(skyCanvas.height - 1, Math.round(skyCanvas.height * fy));
      const data = context.getImageData(Math.round(skyCanvas.width / 2), y, 1, 1).data;
      sky.push(...pixel(data, 0));
    }
  }

  // The cloud plate's alpha is sparse: probe each row for its densest streak
  // pixel — a stable, scroll-deterministic read on the tinted plate.
  let clouds = null;
  if (cloudsCanvas instanceof HTMLCanvasElement && cloudsCanvas.width > 0) {
    const context = cloudsCanvas.getContext("2d");
    clouds = [];
    for (const fy of [0.35, 0.5, 0.65]) {
      const y = Math.min(cloudsCanvas.height - 1, Math.round(cloudsCanvas.height * fy));
      const row = context.getImageData(0, y, cloudsCanvas.width, 1).data;
      let best = 0;
      for (let i = 4; i < row.length; i += 4) {
        if (row[i + 3] > row[best + 3]) best = i;
      }
      clouds.push(...pixel(row, best));
    }
  }

  return {
    scrollY: window.scrollY,
    starsTop: stars ? stars.getBoundingClientRect().top : null,
    starsOpacity: stars ? Number(getComputedStyle(stars).opacity) : null,
    sky,
    clouds,
    cards: [...document.querySelectorAll(".article-deck .scroll-stack-card")].map((c) => {
      const cs = getComputedStyle(c);
      return { transform: nums(cs.transform), opacity: Number(cs.opacity) };
    }),
  };
})()`;

export async function sampleLayers(page: Page): Promise<LayerSample> {
  return (await page.evaluate(SAMPLE_FN)) as LayerSample;
}

/** Dismiss the entrance curtain (any keydown completes it) and wait for hydration. */
export async function gotoReady(page: Page): Promise<void> {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // The curtain mounts after hydration; poke it until main content exists.
  await page.waitForFunction(() => document.querySelector("#main-content, [role='dialog']") !== null, undefined, { timeout: 60_000 });
  for (let i = 0; i < 20; i += 1) {
    if (await page.locator("#main-content").count()) break;
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }
  await page.waitForSelector("#main-content", { timeout: 30_000 });
  await page.waitForSelector(".adaline-footer-scene", { timeout: 30_000 });
  // Give lazy layout (images, Lenis resize timers) a beat to settle.
  await page.waitForTimeout(800);
}

/** Jump the shared scroll source to `y` and wait until scroll position is stable. */
export async function scrollToAndSettle(page: Page, y: number): Promise<void> {
  await page.evaluate(async (target) => {
    const lenis = (window as unknown as { __portfolioLenis?: { scrollTo: (t: number, o?: object) => void } }).__portfolioLenis;
    if (lenis) {
      lenis.scrollTo(target, { immediate: true, force: true });
    } else {
      window.scrollTo(0, target);
    }
  }, y);
  // Wait until window.scrollY stops changing (3 stable rAF frames), then flush
  // a couple more frames so framer-motion's frame loop applies its transforms.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let last = window.scrollY;
        let stable = 0;
        const tick = () => {
          const now = window.scrollY;
          stable = Math.abs(now - last) < 0.5 ? stable + 1 : 0;
          last = now;
          if (stable >= 3) {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          } else {
            requestAnimationFrame(tick);
          }
        };
        requestAnimationFrame(tick);
      }),
  );
}

export function diffArrays(a: number[] | null, b: number[] | null): number {
  if (!a || !b) return a === b ? 0 : Number.POSITIVE_INFINITY;
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let max = 0;
  for (let i = 0; i < a.length; i += 1) max = Math.max(max, Math.abs(a[i] - b[i]));
  return max;
}

/**
 * Max divergence between two samples of the same scroll position. A non-zero
 * value means some layer kept animating on its own clock ("skid").
 */
export function layerDrift(a: LayerSample, b: LayerSample): { metric: string; value: number }[] {
  const drifts: { metric: string; value: number }[] = [];
  if (a.starsTop !== null && b.starsTop !== null) drifts.push({ metric: "stars-top", value: Math.abs(a.starsTop - b.starsTop) });
  if (a.starsOpacity !== null && b.starsOpacity !== null)
    drifts.push({ metric: "stars-opacity", value: Math.abs(a.starsOpacity - b.starsOpacity) });
  drifts.push({ metric: "sky-rgb", value: diffArrays(a.sky, b.sky) });
  drifts.push({ metric: "clouds-rgb", value: diffArrays(a.clouds, b.clouds) });
  a.cards.forEach((card, i) => {
    const other = b.cards[i];
    if (!other) return;
    drifts.push({ metric: `card-${i}-transform`, value: diffArrays(card.transform, other.transform) });
    drifts.push({ metric: `card-${i}-opacity`, value: Math.abs(card.opacity - other.opacity) });
  });
  return drifts;
}

/** Sum a sparse sample of the aurora canvas pixels — changes frame to frame while animating.
 *  Samples the bottom-left quadrant, where the horizon-anchored curtains are brightest. */
export async function auroraPixelSum(page: Page, selector: string): Promise<number | null> {
  return page.evaluate((sel) => {
    const canvas = document.querySelector<HTMLCanvasElement>(sel);
    if (!canvas || canvas.width === 0) return null;
    const context = canvas.getContext("2d");
    if (!context) return null;
    const w = Math.min(canvas.width, 400);
    const h = Math.min(canvas.height, 400);
    const data = context.getImageData(0, canvas.height - h, w, h).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 53) sum += data[i];
    return sum;
  }, selector);
}
