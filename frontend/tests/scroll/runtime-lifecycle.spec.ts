import { expect, test, type Page } from "@playwright/test";

import { gotoReady, scrollToAndSettle } from "./helpers";

async function installCameraProbe(page: Page) {
  await page.addInitScript(() => {
    let cameraCalls = 0;
    const getUserMedia = () => {
      cameraCalls += 1;
      return Promise.reject(new DOMException("Camera access is forbidden in this test.", "NotAllowedError"));
    };
    const mediaDevices = navigator.mediaDevices ?? ({} as MediaDevices);
    Object.defineProperty(mediaDevices, "getUserMedia", { configurable: true, value: getUserMedia });
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: mediaDevices });
    Object.defineProperty(window, "__cameraCalls", {
      configurable: true,
      get: () => cameraCalls,
    });
  });
}

async function setSyntheticVisibility(page: Page, hidden: boolean) {
  await page.evaluate((nextHidden) => {
    if (nextHidden) {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    } else {
      delete (document as Document & { hidden?: boolean }).hidden;
      delete (document as Document & { visibilityState?: DocumentVisibilityState }).visibilityState;
    }
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

async function expectTidesFallbackPainted(page: Page) {
  const fallback = await page.locator("[data-tides-background] canvas").evaluate((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) return { context: false, painted: false };
    const context = canvas.getContext("2d");
    if (!context || canvas.width === 0 || canvas.height === 0) return { context: false, painted: false };
    const pixel = context.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
    return { context: true, painted: pixel[3] > 0 };
  });
  expect(fallback).toEqual({ context: true, painted: true });
}

test("greeting waits for a real Tides paint and recovers from an asynchronous worker failure", async ({ page }) => {
  await page.addInitScript(() => {
    class FailingWorker extends EventTarget {
      postMessage() {
        window.setTimeout(() => this.dispatchEvent(new Event("error")), 0);
      }
      terminate() {}
    }
    Object.defineProperty(window, "Worker", { configurable: true, value: FailingWorker });
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#about")).toHaveCount(1, { timeout: 7_000 });
  await expect(page.getByRole("dialog", { name: "Entrance greeting" })).toHaveCount(0);
  await expectTidesFallbackPainted(page);
});

test("Tides replaces a transferred canvas before a synchronous main-thread fallback", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "transferControlToOffscreen", {
      configurable: true,
      value: () => {
        throw new DOMException("The canvas was already transferred.", "InvalidStateError");
      },
    });
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#about")).toHaveCount(1, { timeout: 7_000 });
  await expect(page.getByRole("dialog", { name: "Entrance greeting" })).toHaveCount(0);
  await expectTidesFallbackPainted(page);
});

test("footer and globe release render resources offscreen and while the tab is hidden", async ({ page }) => {
  await gotoReady(page);

  await expect(page.locator('[data-scroll-scene="sky-gradient"]')).toHaveCount(0);
  await expect(page.locator('[data-scroll-scene="drift-clouds"]')).toHaveCount(0);
  await expect(page.locator("[data-ambient-aurora]")).toHaveCount(0);
  await expect(page.locator("[data-ready] canvas")).toHaveCount(1);

  const globe = page.locator("[data-ready]");
  await globe.scrollIntoViewIfNeeded();
  await expect(page.locator("[data-ready] canvas")).toHaveCount(1);
  await setSyntheticVisibility(page, true);
  await expect(page.locator("[data-ready] canvas")).toHaveCount(0);
  await setSyntheticVisibility(page, false);
  await expect(page.locator("[data-ready] canvas")).toHaveCount(1);

  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scroll-scene="sky-gradient"]')).toHaveCount(1);
  await expect(page.locator('[data-scroll-scene="drift-clouds"]')).toHaveCount(1);
  await expect(page.locator("[data-ambient-aurora]")).toHaveCount(1);
  await expect(page.locator("[data-ready] canvas")).toHaveCount(0);

  await setSyntheticVisibility(page, true);
  await expect(page.locator('[data-scroll-scene="sky-gradient"]')).toHaveCount(0);
  await expect(page.locator("[data-ambient-aurora]")).toHaveCount(0);
  await setSyntheticVisibility(page, false);
  await expect(page.locator('[data-scroll-scene="sky-gradient"]')).toHaveCount(1);

  await scrollToAndSettle(page, 0);
  await expect(page.locator('[data-scroll-scene="sky-gradient"]')).toHaveCount(0);
  await expect(page.locator('[data-scroll-scene="drift-clouds"]')).toHaveCount(0);
  await expect(page.locator("[data-ready] canvas")).toHaveCount(1);
});

test("direct and header login flows never request a camera and retain the passcode fallback", async ({ page }) => {
  await installCameraProbe(page);
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("dialog", { name: "Secure login" })).toBeVisible();
  await expect(page.locator(".reflective-texture")).toHaveCount(1);
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.getByPlaceholder("Enter admin passcode")).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { __cameraCalls?: number }).__cameraCalls ?? -1)).toBe(0);

  await gotoReady(page);
  await expect(page.getByRole("button", { name: "Open secure login" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Open secure login" }).first().click();
  await expect(page.getByRole("dialog", { name: "Secure login" })).toBeVisible();
  await expect(page.locator(".reflective-texture")).toHaveCount(1);
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.getByPlaceholder("Enter admin passcode")).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { __cameraCalls?: number }).__cameraCalls ?? -1)).toBe(0);
  expect(consoleErrors).toEqual([]);
});
