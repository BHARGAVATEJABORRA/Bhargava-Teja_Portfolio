import { expect, test } from "@playwright/test";

import { gotoReady } from "./helpers";

test("Enter Portfolio scrolls to the About section", async ({ page }) => {
  await gotoReady(page);

  const about = page.locator("#about");
  await expect(about).toHaveCount(1);
  await page.getByRole("button", { name: "Enter Portfolio", exact: true }).click();

  await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#about");
  await expect
    .poll(() => about.evaluate((element) => Math.abs(element.getBoundingClientRect().top)))
    .toBeLessThan(180);
});
