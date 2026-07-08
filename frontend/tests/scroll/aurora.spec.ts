import { expect, test } from "@playwright/test";

import { gotoReady } from "./helpers";

const AURORA = ".adaline-footer-scene [data-ambient-aurora]";

// §3.3 — the aurora is a static CSS glow anchored inside the footer's CTA
// band (reference: adaline.ai footer). No canvas, no scroll dependency: the
// only motion allowed is the slow opacity breath. Being absolutely
// positioned inside the footer subtree, it cannot drift during scroll.
test.describe("§3.3 footer aurora is a static ridgeline glow", () => {
  test("aurora layer is scene-anchored with radial emerald gradients and only an opacity breath", async ({ page }) => {
    await gotoReady(page);

    const aurora = page.locator(AURORA);
    await expect(aurora).toHaveCount(1);

    const computed = await aurora.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        position: style.position,
        background: style.backgroundImage,
        blend: style.mixBlendMode,
        animationName: style.animationName,
        animationDuration: style.animationDuration,
        bottom: style.bottom,
      };
    });

    // Anchored in the scene, not the viewport: absolute (inside the CTA
    // band), pinned to its wrapper's bottom so the hills overlap its
    // brightest edge.
    expect(computed.position).toBe("absolute");
    expect(computed.bottom).toBe("0px");

    // Three overlapping radial gradients in the reference emerald.
    const radialCount = (computed.background.match(/radial-gradient/g) ?? []).length;
    expect(radialCount).toBe(3);
    expect(computed.background).toContain("rgba(16, 185, 129");
    expect(computed.blend).toBe("screen");

    // The ONLY animation is the slow opacity breath (8–10s).
    expect(computed.animationName).toBe("adaline-aurora-breath");
    expect(parseFloat(computed.animationDuration)).toBeGreaterThanOrEqual(8);
    expect(parseFloat(computed.animationDuration)).toBeLessThanOrEqual(10);
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
