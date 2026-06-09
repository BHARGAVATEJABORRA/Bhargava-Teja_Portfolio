import { expect, test } from "@playwright/test";

import { auroraPixelSum, gotoReady, scrollToAndSettle } from "./helpers";

const AURORA_CANVAS = "[data-ambient-aurora] canvas";

test.describe("§3.3 aurora is a persistent, continuously animating ambient layer", () => {
  test("aurora exists and animates at hero, mid-page, and footer", async ({ page }) => {
    await gotoReady(page);

    const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    const positions: [string, number][] = [
      ["hero", 0],
      ["mid-page", Math.round(maxScroll * 0.45)],
      ["footer", maxScroll],
    ];

    for (const [label, offset] of positions) {
      await scrollToAndSettle(page, offset);

      const first = await auroraPixelSum(page, AURORA_CANVAS);
      expect(first, `aurora canvas missing or empty at ${label}`).not.toBeNull();

      // Continuously animating: the drawn pixels must change over time at
      // EVERY scroll position — no IntersectionObserver freeze, no hard cuts.
      await page.waitForTimeout(450);
      const second = await auroraPixelSum(page, AURORA_CANVAS);
      expect(second, `aurora frozen at ${label}`).not.toBe(first);
    }
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
