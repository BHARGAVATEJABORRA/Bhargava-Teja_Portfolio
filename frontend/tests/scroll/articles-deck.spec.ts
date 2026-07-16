import { expect, test, type Page } from "@playwright/test";

import { gotoReady, scrollToAndSettle } from "./helpers";

async function galleryRange(page: Page) {
  return page.evaluate(() => {
    const track = document.querySelector<HTMLElement>("#blogs .projects-scroll-track");
    const gallery = document.querySelector<HTMLElement>("#blogs .projects-gallery");
    if (!track || !gallery) return null;
    const rect = track.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      bottom: rect.bottom + window.scrollY,
      cardCount: gallery.children.length,
    };
  });
}

async function galleryX(page: Page) {
  return page.locator("#blogs .projects-gallery").evaluate((gallery) => {
    const transform = getComputedStyle(gallery).transform;
    if (!transform || transform === "none") return 0;
    const numbers = (transform.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    return numbers.length === 6 ? numbers[4] : numbers[12] ?? 0;
  });
}

test.describe("§4 articles horizontal gallery", () => {
  test("gallery movement is monotonic and determined by vertical scroll", async ({ page }) => {
    await gotoReady(page);

    const range = await galleryRange(page);
    expect(range).not.toBeNull();
    expect(range!.cardCount).toBeGreaterThanOrEqual(5);

    const end = range!.bottom - page.viewportSize()!.height;
    const offsets = [range!.top, range!.top + (end - range!.top) * 0.5, end].map(Math.round);
    const positions: number[] = [];
    for (const offset of offsets) {
      await scrollToAndSettle(page, offset);
      positions.push(await galleryX(page));
    }

    expect(positions[0]).toBeCloseTo(0, 0);
    expect(positions[1]).toBeLessThan(positions[0]);
    expect(positions[2]).toBeLessThan(positions[1]);

    await scrollToAndSettle(page, offsets[1]);
    const replay = await galleryX(page);
    await page.waitForTimeout(650);
    expect(await galleryX(page)).toBeCloseTo(replay, 1);
    expect(replay).toBeCloseTo(positions[1], 1);
  });

  test("reduced motion keeps every article and uses no time-based gallery animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoReady(page);

    const range = await galleryRange(page);
    expect(range).not.toBeNull();
    await expect(page.locator("#blogs .projects-gallery > *")).toHaveCount(range!.cardCount);

    const timing = await page.locator("#blogs .projects-gallery").evaluate((gallery) => {
      const style = getComputedStyle(gallery);
      return { animation: style.animationName, transition: style.transitionDuration };
    });
    expect(timing.animation).toBe("none");
    expect(parseFloat(timing.transition)).toBeLessThanOrEqual(0.001);
  });
});
