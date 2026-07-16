import { expect, test } from "@playwright/test";

import { gotoReady, scrollToAndSettle } from "./helpers";

test.describe("§5 AI companion dock", () => {
  test("dock opens on click and never overlaps the footer CTA", async ({ page }) => {
    await gotoReady(page);

    const launcher = page.locator(".ai-dock-launcher");
    await expect(launcher).toBeVisible();

    // Scroll to the contact CTA and confirm the launcher does not cover it.
    const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    await page.evaluate(() => document.querySelector("#contact")?.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(400);

    const ctaButton = page.locator("#contact button[type='submit'], #contact a").first();
    if (await ctaButton.count()) {
      const ctaBox = await ctaButton.boundingBox();
      const dockBox = await launcher.boundingBox();
      if (ctaBox && dockBox) {
        const overlaps =
          dockBox.x < ctaBox.x + ctaBox.width &&
          dockBox.x + dockBox.width > ctaBox.x &&
          dockBox.y < ctaBox.y + ctaBox.height &&
          dockBox.y + dockBox.height > ctaBox.y;
        expect(overlaps, "dock overlaps the contact CTA").toBe(false);
      }
    }

    // Footer nav links must also stay clear of the launcher.
    await scrollToAndSettle(page, maxScroll);
    await launcher.click();
    await expect(page.locator(".ai-dock-window")).toBeVisible();
    await launcher.click();
    await expect(page.locator(".ai-dock-window")).toHaveCount(0);
  });

  test("launcher icon spins on hover (desktop only)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "hover is a pointer-fine interaction");
    await gotoReady(page);

    const launcher = page.locator(".ai-dock-launcher");
    await launcher.hover();
    await page.waitForTimeout(180);
    const iconStyle = await page.locator(".ai-dock-launcher-icon").evaluate((el) => {
      const style = getComputedStyle(el);
      return { transform: style.transform, transitionDuration: style.transitionDuration };
    });
    expect(iconStyle.transitionDuration).not.toBe("0s");
    expect(iconStyle.transform).not.toBe("none");
    expect(iconStyle.transform).not.toBe("matrix(1, 0, 0, 1, 0, 0)");
  });

  test("launcher does not spin under reduced motion", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "hover is a pointer-fine interaction");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoReady(page);

    const launcher = page.locator(".ai-dock-launcher");
    await launcher.hover();
    await page.waitForTimeout(180);
    const iconStyle = await page.locator(".ai-dock-launcher-icon").evaluate((el) => {
      const style = getComputedStyle(el);
      return { transform: style.transform, transitionDuration: style.transitionDuration };
    });
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(iconStyle.transform);
    // Chromium serializes a zero-duration reduced-motion transition as a
    // 10-microsecond floor rather than the literal string "0s".
    expect(parseFloat(iconStyle.transitionDuration)).toBeLessThanOrEqual(0.001);
  });
});
