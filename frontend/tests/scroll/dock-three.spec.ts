import { expect, test } from "@playwright/test";

import { gotoReady } from "./helpers";

test.describe("§6 lightweight dock night scene", () => {
  test("dock uses the completed responsive artwork without a WebGL context", async ({ page }) => {
    await gotoReady(page);

    await page.locator("#contact").scrollIntoViewIfNeeded();

    const dock = page.locator('[data-scroll-scene="dock-three"]');
    await expect(dock).toHaveCount(1);
    await expect(dock.locator("canvas")).toHaveCount(0);
    await expect(dock.locator('img[src^="/_next/image"]')).toHaveCount(1);
  });

  test("reduced motion: static dock images render instead of the WebGL canvas", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoReady(page);

    await expect(page.locator('[data-scroll-scene="dock-three"]')).toHaveCount(0);
    await expect(page.locator("[data-footer-dock-static]")).toHaveCount(1);
    await expect(page.locator('[data-dock-reflection="static"]')).toHaveCount(0);
    await expect(page.locator('img[src="/adaline-scenes/footer/footer-dock-reflection.webp"]')).toHaveCount(0);
  });
});
