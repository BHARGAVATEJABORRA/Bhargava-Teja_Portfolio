import { expect, test } from "@playwright/test";

import { gotoReady, layerDrift, sampleLayers, scrollToAndSettle } from "./helpers";

async function deckRange(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const deck = document.querySelector<HTMLElement>(".article-deck");
    if (!deck) return null;
    const rect = deck.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      bottom: rect.bottom + window.scrollY,
      cardCount: deck.querySelectorAll(".article-card").length,
    };
  });
}

function scaleOf(transform: number[]): number {
  // computed transform is matrix(a, b, c, d, tx, ty) — a is the x scale.
  return transform.length >= 6 ? transform[0] : 1;
}

test.describe("§4 articles sticky-stacking deck", () => {
  test("cards scale down as the next card pins over, tracking scroll 1:1", async ({ page }) => {
    await gotoReady(page);

    const range = await deckRange(page);
    expect(range).not.toBeNull();
    expect(range!.cardCount).toBeGreaterThanOrEqual(5);

    const viewport = page.viewportSize()!;
    const start = Math.max(0, range!.top - viewport.height * 0.5);
    const end = range!.bottom - viewport.height;
    const steps = 12;

    const scaleHistory: number[][] = [];
    for (let i = 0; i < steps; i += 1) {
      const offset = Math.round(start + ((end - start) * i) / (steps - 1));
      await scrollToAndSettle(page, offset);
      const sample = await sampleLayers(page);
      scaleHistory.push(sample.cards.map((card) => scaleOf(card.transform)));
    }

    const finalScales = scaleHistory[scaleHistory.length - 1];

    // Every covered card (all but the last) must have shrunk below 1 by the
    // time the deck is fully scrolled, but never collapse past ~0.85.
    for (let card = 0; card < range!.cardCount - 1; card += 1) {
      expect.soft(finalScales[card], `card ${card} final scale`).toBeLessThan(0.995);
      expect.soft(finalScales[card], `card ${card} final scale floor`).toBeGreaterThan(0.85);
    }
    // The last (topmost) card stays at full scale.
    expect.soft(finalScales[range!.cardCount - 1], "last card stays unscaled").toBeGreaterThan(0.995);

    // Scales must fall monotonically with scroll — scroll-linked, not time-linked.
    for (let card = 0; card < range!.cardCount - 1; card += 1) {
      for (let i = 1; i < scaleHistory.length; i += 1) {
        expect
          .soft(scaleHistory[i][card], `card ${card} monotonic at step ${i}`)
          .toBeLessThanOrEqual(scaleHistory[i - 1][card] + 0.005);
      }
    }

    // Determinism: parked mid-deck, nothing may keep easing after scroll stops.
    const mid = Math.round((start + end) / 2);
    await scrollToAndSettle(page, mid);
    const immediate = await sampleLayers(page);
    await page.waitForTimeout(650);
    const later = await sampleLayers(page);
    for (const { metric, value } of layerDrift(immediate, later)) {
      if (!metric.startsWith("card-")) continue;
      expect.soft(value, `post-stop drift of ${metric} mid-deck`).toBeLessThanOrEqual(0.02);
    }
  });

  test("reduced motion: cards render as a plain stacked list without transforms", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoReady(page);

    const range = await deckRange(page);
    expect(range).not.toBeNull();

    const viewport = page.viewportSize()!;
    await scrollToAndSettle(page, range!.bottom - viewport.height);
    const transforms = await page.evaluate(() =>
      [...document.querySelectorAll(".article-card")].map((card) => getComputedStyle(card).transform),
    );
    for (const transform of transforms) {
      expect.soft(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(transform);
    }
  });
});
