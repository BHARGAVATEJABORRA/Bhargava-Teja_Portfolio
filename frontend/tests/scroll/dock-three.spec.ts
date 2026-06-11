import { expect, test } from "@playwright/test";

import { gotoReady, scrollToAndSettle } from "./helpers";

test.describe("§6 Three.js dock night scene", () => {
  test("glow progress is a pure function of scroll and completes at page end", async ({ page }) => {
    await gotoReady(page);

    const dock = page.locator('[data-scroll-scene="dock-three"]');
    await expect(dock).toHaveCount(1);
    await expect(dock.locator("canvas")).toHaveCount(1);

    const { start, max } = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('[data-scroll-scene="dock-three"]');
      const top = el ? el.getBoundingClientRect().top + window.scrollY : 0;
      return {
        start: Math.max(0, top - window.innerHeight),
        max: document.documentElement.scrollHeight - window.innerHeight,
      };
    });

    const readProgress = async () =>
      Number(await dock.getAttribute("data-dock-progress"));

    // Before the band enters the viewport the glow has not started.
    await scrollToAndSettle(page, Math.max(0, start - 200));
    expect(await readProgress()).toBe(0);

    // Progress tracks scroll monotonically through the band...
    const samples: number[] = [];
    for (const t of [0.25, 0.5, 0.75]) {
      await scrollToAndSettle(page, Math.round(start + (max - start) * t));
      samples.push(await readProgress());
    }
    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i]).toBeGreaterThan(samples[i - 1]);
    }

    // ...and completes exactly at the end of the page.
    await scrollToAndSettle(page, max);
    expect(await readProgress()).toBe(1);

    // Scrubbing back reverses cleanly — same position, same progress.
    await scrollToAndSettle(page, Math.round(start + (max - start) * 0.5));
    expect(await readProgress()).toBeCloseTo(samples[1], 2);
  });

  test("reduced motion: static dock images render instead of the WebGL canvas", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoReady(page);

    await expect(page.locator('[data-scroll-scene="dock-three"]')).toHaveCount(0);
    await expect(page.locator('img[src="/adaline-scenes/footer/footer-dock.webp"]')).toHaveCount(1);
    await expect(page.locator('img[src="/adaline-scenes/footer/footer-dock-reflection.webp"]')).toHaveCount(1);
  });
});
