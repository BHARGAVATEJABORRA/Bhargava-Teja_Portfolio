import type { Page } from "@playwright/test";

/** Numeric snapshot of every scroll-linked footer/article layer. */
export interface LayerSample {
  scrollY: number;
  /** viewport-relative top of the in-flow starfield (moves 1:1 with scroll) */
  starsTop: number | null;
  starsOpacity: number | null;
  /** rgb channels parsed from the fixed sky gradient */
  sky: number[] | null;
  /** rgb channels parsed from the cloud-band gradient */
  clouds: number[] | null;
  /** computed transform matrix + opacity per article card */
  cards: { transform: number[]; opacity: number }[];
}

const SAMPLE_FN = `(() => {
  const nums = (s) => (s && s !== "none" ? (s.match(/-?\\d+(?:\\.\\d+)?/g) || []).map(Number) : []);
  const q = (sel) => document.querySelector(sel);

  const stars = q('[data-scroll-scene="stars"]');
  const sky = q('[data-scroll-scene="sky-gradient"]');
  const clouds = q('[data-scroll-scene="clouds"]');

  return {
    scrollY: window.scrollY,
    starsTop: stars ? stars.getBoundingClientRect().top : null,
    starsOpacity: stars ? Number(getComputedStyle(stars).opacity) : null,
    sky: sky ? nums(getComputedStyle(sky).backgroundImage || getComputedStyle(sky).background) : null,
    clouds: clouds ? nums(getComputedStyle(clouds).backgroundImage || getComputedStyle(clouds).background) : null,
    cards: [...document.querySelectorAll(".article-card")].map((c) => {
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

/** Sum a sparse sample of the aurora canvas pixels — changes frame to frame while animating. */
export async function auroraPixelSum(page: Page, selector: string): Promise<number | null> {
  return page.evaluate((sel) => {
    const canvas = document.querySelector<HTMLCanvasElement>(sel);
    if (!canvas || canvas.width === 0) return null;
    const context = canvas.getContext("2d");
    if (!context) return null;
    const w = Math.min(canvas.width, 400);
    const h = Math.min(canvas.height, 400);
    const data = context.getImageData(0, 0, w, h).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 53) sum += data[i];
    return sum;
  }, selector);
}
