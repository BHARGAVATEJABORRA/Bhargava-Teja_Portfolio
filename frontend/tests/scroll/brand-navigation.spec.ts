import { expect, test } from "@playwright/test";

import { gotoReady, scrollToAndSettle } from "./helpers";

test("brand refresh always returns to the hero", async ({ page }) => {
  await gotoReady(page);
  await scrollToAndSettle(
    page,
    await page.locator("#contact").evaluate((section) => section.getBoundingClientRect().top + window.scrollY),
  );
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.getByRole("link", { name: "Bhargava Teja Borra", exact: true }).click(),
  ]);

  await expect.poll(() => page.evaluate(() => window.location.hash), { timeout: 10_000 }).toBe("");
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBeLessThan(8);
  await expect
    .poll(() =>
      page.evaluate(
        () => (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type,
      ),
    )
    .toBe("reload");
});

test("an ordinary browser refresh preserves the current section", async ({ page }) => {
  await gotoReady(page);
  await scrollToAndSettle(
    page,
    await page.locator("#contact").evaluate((section) => section.getBoundingClientRect().top + window.scrollY),
  );
  const previousScrollY = await page.evaluate(() => window.scrollY);
  expect(previousScrollY).toBeGreaterThan(500);

  await page.reload({ waitUntil: "domcontentloaded" });

  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 })
    .toBeGreaterThan(previousScrollY * 0.8);
});
