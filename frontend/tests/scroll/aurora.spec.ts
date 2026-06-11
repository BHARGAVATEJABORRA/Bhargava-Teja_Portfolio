import { expect, test } from "@playwright/test";

import { auroraPixelSum, gotoReady, scrollToAndSettle } from "./helpers";

const AURORA_CANVAS = "[data-ambient-aurora] canvas";

test.describe("§3.3 aurora is a night-only ambient layer", () => {
  test("aurora is dark before night and animates over the CTA swell", async ({ page }) => {
    await gotoReady(page);

    const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

    // Before night settles the canvas exists but draws nothing: intensity is
    // provably zero through the hero, the page body, and the entire sunset —
    // five points spanning dawn → full sunset → dusk (night begins ~0.85).
    for (const [label, offset] of [
      ["hero", 0],
      ["body", Math.round(maxScroll * 0.25)],
      ["mid-page", Math.round(maxScroll * 0.45)],
      ["sunset", Math.round(maxScroll * 0.65)],
      ["dusk", Math.round(maxScroll * 0.78)],
    ] as const) {
      await scrollToAndSettle(page, offset);

      const first = await auroraPixelSum(page, AURORA_CANVAS);
      expect(first, `aurora canvas missing at ${label}`).not.toBeNull();
      expect(first, `aurora visible too early at ${label}`).toBe(0);

      await page.waitForTimeout(450);
      const second = await auroraPixelSum(page, AURORA_CANVAS);
      expect(second, `aurora lit up while idle at ${label}`).toBe(0);
    }

    // Over the CTA (night settled) the swell is visible and continuously
    // animating — no IntersectionObserver freeze, no hard cuts.
    await scrollToAndSettle(page, Math.round(maxScroll * 0.92));
    const ctaFirst = await auroraPixelSum(page, AURORA_CANVAS);
    expect(ctaFirst, "aurora canvas missing at CTA").not.toBeNull();
    expect(ctaFirst, "aurora empty at CTA night swell").toBeGreaterThan(0);

    await page.waitForTimeout(450);
    const ctaSecond = await auroraPixelSum(page, AURORA_CANVAS);
    expect(ctaSecond, "aurora frozen at CTA").not.toBe(ctaFirst);

    // At the dock only a whisper remains (intensity ≤ 0.05); pixel values are
    // so quantized that frames can legitimately repeat, so just require the
    // canvas to still be there.
    await scrollToAndSettle(page, maxScroll);
    const dock = await auroraPixelSum(page, AURORA_CANVAS);
    expect(dock, "aurora canvas missing at dock").not.toBeNull();
  });

  test("aurora is static under prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoReady(page);

    const first = await auroraPixelSum(page, AURORA_CANVAS);
    if (first === null) return; // hidden entirely is acceptable under reduced motion
    await page.waitForTimeout(450);
    const second = await auroraPixelSum(page, AURORA_CANVAS);
    expect(second).toBe(first);
  });
});
