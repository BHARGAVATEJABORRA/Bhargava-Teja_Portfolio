import { expect, test } from "@playwright/test";

import { gotoReady, scrollToAndSettle } from "./helpers";

test("brand navigates home and returns to the hero without a reload", async ({ page }) => {
  await gotoReady(page);
  await scrollToAndSettle(
    page,
    await page.locator("#contact").evaluate((section) => section.getBoundingClientRect().top + window.scrollY),
  );
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);

  const navigationCount = await page.evaluate(() => performance.getEntriesByType("navigation").length);
  await page.getByRole("link", { name: "Bhargava Teja Borra", exact: true }).click();

  await expect.poll(() => page.evaluate(() => window.location.pathname), { timeout: 10_000 }).toBe("/");
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBeLessThan(8);
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType("navigation").length)).toBe(navigationCount);
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
