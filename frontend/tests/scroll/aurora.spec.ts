import { expect, test } from "@playwright/test";

import { gotoReady } from "./helpers";

const AURORA = ".adaline-footer-scene [data-ambient-aurora]";

// §3.3 — the current aurora is a scene-anchored WebGL curtain. Its wrapper is
// absolute inside the CTA band, while the shader clock supplies the slow
// ambient motion independently of the scroll-linked footer layers.
test.describe("§3.3 footer aurora is a scene-anchored WebGL curtain", () => {
  test("aurora wrapper stays anchored and its canvas renders", async ({ page }) => {
    await gotoReady(page);

    const aurora = page.locator(AURORA);
    await expect(aurora).toHaveCount(1);

    const computed = await aurora.evaluate((element) => {
      const style = getComputedStyle(element);
      return { position: style.position, bottom: style.bottom, mask: style.maskImage };
    });

    expect(computed.position).toBe("absolute");
    expect(computed.bottom).toBe("174px");
    expect(computed.mask).toContain("linear-gradient");

    const canvas = aurora.locator("canvas");
    await expect(canvas).toHaveCount(1);
    await expect.poll(async () => Number(await canvas.getAttribute("data-aurora-time"))).toBeGreaterThan(0);
  });

  // 2026-07-07: the CSS keyframe meteors were replaced by adaline.ai's real
  // system (components/scenes/footer-meteors.tsx): a bg-black
  // mix-blend-plus-lighter layer into which JS spawns streak <img>s every
  // 5–10s (first one ~0.8s after the layer becomes visible), flying them
  // down-left at rotate(34deg) with a ~0.7s fade.
  test("meteors: adaline plus-lighter layer spawns rotated streak imgs", async ({ page }) => {
    await gotoReady(page);

    const layer = page.locator('[data-scroll-scene="meteors"]');
    await expect(layer).toHaveCount(1);

    const blend = await layer.evaluate((element) => getComputedStyle(element).mixBlendMode);
    expect(blend).toBe("plus-lighter");

    // Old CSS meteors must be gone.
    await expect(page.locator(".adaline-meteor")).toHaveCount(0);

    // Scroll the footer into view so the IntersectionObserver arms spawning,
    // then wait out the first-spawn window (~0.8s) plus flight time.
    await layer.scrollIntoViewIfNeeded();
    const img = layer.locator("img");
    await expect(img.first()).toBeAttached({ timeout: 12_000 });

    const style = await img.first().evaluate((element) => ({
      transform: element.style.transform,
      cls: element.className,
    }));
    expect(style.transform).toContain("rotate(34deg)");
    expect(style.cls).toContain("origin-bottom");
  });
});
