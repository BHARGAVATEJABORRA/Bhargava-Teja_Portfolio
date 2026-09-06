import { expect, test } from "@playwright/test";

import { gotoReady } from "./helpers";

test("globe renderer preloads before the location card is scrolled into view", async ({ page }) => {
  await gotoReady(page);

  // The page begins at its reload position; no scroll is performed here.
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator("[data-ready='true']")).toHaveCount(1);
});
