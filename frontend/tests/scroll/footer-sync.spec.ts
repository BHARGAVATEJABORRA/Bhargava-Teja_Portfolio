import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { gotoReady, layerDrift, sampleLayers, scrollToAndSettle, type LayerSample } from "./helpers";

const OUT_DIR = path.join(__dirname, "__output__");

const DRIFT_EPS: Record<string, number> = {
  "stars-top": 1,
  "stars-opacity": 0.02,
  "sky-rgb": 2.5,
  "clouds-rgb": 2.5,
};

function epsFor(metric: string): number {
  if (metric in DRIFT_EPS) return DRIFT_EPS[metric];
  if (metric.endsWith("-transform")) return 0.02;
  if (metric.endsWith("-opacity")) return 0.02;
  return 0.02;
}

test.describe("§3.1 footer layers are a pure function of scroll", () => {
  test("no skid: layers stop with scroll, reverse cleanly, stars track 1:1", async ({ page }, testInfo) => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    await gotoReady(page);

    const { footerTop, maxScroll } = await page.evaluate(() => {
      const footer = document.querySelector<HTMLElement>(".adaline-footer-scene");
      return {
        footerTop: footer ? footer.getBoundingClientRect().top + window.scrollY : 0,
        maxScroll: document.documentElement.scrollHeight - window.innerHeight,
      };
    });
    expect(footerTop).toBeGreaterThan(0);

    const start = Math.max(0, footerTop - 400);
    const steps = 7;
    const offsets = Array.from({ length: steps }, (_, i) => Math.round(start + ((maxScroll - start) * i) / (steps - 1)));

    const descending: LayerSample[] = [];

    for (const [i, offset] of offsets.entries()) {
      await scrollToAndSettle(page, offset);
      const immediate = await sampleLayers(page);
      await page.waitForTimeout(650);
      const later = await sampleLayers(page);

      // "Stops with scroll in the same frame": nothing scroll-linked may keep
      // moving after the scroll position has settled.
      for (const { metric, value } of layerDrift(immediate, later)) {
        expect.soft(value, `post-stop drift of ${metric} at offset ${offset}`).toBeLessThanOrEqual(epsFor(metric));
      }

      descending.push(later);
      await page.screenshot({ path: path.join(OUT_DIR, `footer-${testInfo.project.name}-down-${i}.png`) });
    }

    // Stars are in normal flow: their viewport-relative top must move exactly
    // -1 * scroll delta between steps (deterministic multiple of scroll delta).
    for (let i = 1; i < descending.length; i += 1) {
      const prev = descending[i - 1];
      const curr = descending[i];
      if (prev.starsTop === null || curr.starsTop === null) continue;
      const scrollDelta = curr.scrollY - prev.scrollY;
      if (scrollDelta === 0) continue;
      const layerDelta = prev.starsTop - curr.starsTop;
      expect
        .soft(Math.abs(layerDelta - scrollDelta), `stars delta vs scroll delta between steps ${i - 1}->${i}`)
        .toBeLessThanOrEqual(1.5);
    }

    // Reversibility: scrolling back up must reproduce the exact same states.
    for (let i = offsets.length - 2; i >= 0; i -= 1) {
      await scrollToAndSettle(page, offsets[i]);
      await page.waitForTimeout(650);
      const ascending = await sampleLayers(page);
      for (const { metric, value } of layerDrift(descending[i], ascending)) {
        expect.soft(value, `reverse mismatch of ${metric} at offset ${offsets[i]}`).toBeLessThanOrEqual(epsFor(metric));
      }
    }
  });
});

test.describe("§3.2 shooting stars", () => {
  test("meteor trail is a gradient fading to transparent — no opaque sprite box", async ({ page }) => {
    await gotoReady(page);
    const meteors = await page.evaluate(() =>
      [...document.querySelectorAll(".adaline-meteor")].map((m) => {
        const cs = getComputedStyle(m);
        return {
          backgroundImage: cs.backgroundImage,
          backgroundColor: cs.backgroundColor,
          border: cs.borderStyle,
        };
      }),
    );
    expect(meteors.length).toBeGreaterThan(0);
    for (const meteor of meteors) {
      expect(meteor.backgroundImage).toContain("gradient");
      expect(meteor.backgroundImage).not.toContain("url(");
      expect(["rgba(0, 0, 0, 0)", "transparent"]).toContain(meteor.backgroundColor);
      expect(meteor.border).toBe("none");
    }
  });
});
