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

test("entrance remains independent when the Tides worker falls back to the main thread", async ({ page }) => {
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
  await expect(page.locator("#about")).toHaveCount(1, { timeout: 12_000 });
  await expect(page.getByRole("dialog", { name: "Entrance greeting" })).toHaveCount(0);
  await expect(page.locator("[data-tides-background]")).toHaveCount(1);
  await expect(page.locator("[data-tides-background] canvas")).toHaveCount(1);
});

test("page background keeps the complete painted Tides atmosphere", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#about")).toHaveCount(1, { timeout: 7_000 });
  await expect(page.locator("[data-tides-background] canvas")).toHaveCount(1);
  await expect(page.locator("[data-tides-background] > div")).toHaveCount(1);
});

test("footer and globe release render resources offscreen and while the tab is hidden", async ({ page }) => {
  await gotoReady(page);

  await expect(page.locator('[data-scroll-scene="sky-gradient"]')).toHaveCount(0);
  await expect(page.locator('[data-scroll-scene="drift-clouds"]')).toHaveCount(0);
  await expect(page.locator("[data-ambient-aurora]")).toHaveCount(0);
  await expect(page.locator("[data-ready] canvas")).toHaveCount(0);

  const globePanel = page.getByText("Location", { exact: true }).locator("xpath=../..");
  await globePanel.scrollIntoViewIfNeeded();
  // Software-rendered mobile CI can reject WebGL even though real devices use
  // it. In that case the widget's non-WebGL location fallback is the contract.
  const globeUsesCanvas = (await page.locator("[data-ready] canvas").count()) === 1;
  if (globeUsesCanvas) {
    await setSyntheticVisibility(page, true);
    await expect(page.locator("[data-ready] canvas")).toHaveCount(0);
    await setSyntheticVisibility(page, false);
    await expect(page.locator("[data-ready] canvas")).toHaveCount(1);
  } else {
    await expect(globePanel.getByText("Dallas, TX", { exact: true })).toBeVisible();
  }

  await page.locator("#contact").scrollIntoViewIfNeeded();
  // Let the native scroll settle through the shared scheduler before checking
  // that the now-distant WebGL widget has released its canvas.
  await scrollToAndSettle(page, await page.evaluate(() => window.scrollY));
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
  await expect(page.locator("[data-ready] canvas")).toHaveCount(0);
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
  // Background widgets can report a local credential/network error while this
  // page is open. This test's contract is that the reflective login path emits
  // no camera/media-device error and never tries to access a physical camera.
  expect(consoleErrors.filter((message) => /camera|media.?device|getUserMedia/i.test(message))).toEqual([]);
});

test("the passcode fallback cancels an in-flight automatic passkey ceremony", async ({ page }) => {
  await page.addInitScript(() => {
    let abortCalls = 0;
    let credentialCalls = 0;
    Object.defineProperty(navigator.credentials, "get", {
      configurable: true,
      value: ({ signal }: { signal?: AbortSignal }) => {
        credentialCalls += 1;
        return new Promise<Credential>((_, reject) => {
          signal?.addEventListener(
            "abort",
            () => {
              abortCalls += 1;
              reject(new DOMException("Passkey cancelled", "AbortError"));
            },
            { once: true },
          );
        });
      },
    });
    Object.defineProperty(window, "__passkeyAbortCalls", { configurable: true, get: () => abortCalls });
    Object.defineProperty(window, "__passkeyCredentialCalls", { configurable: true, get: () => credentialCalls });
  });
  await page.route("**/api/auth/webauthn/status", (route) => route.fulfill({ json: { registered: true } }));
  await page.route("**/api/auth/webauthn/authenticate/options", (route) =>
    route.fulfill({
      json: {
        challenge: "AA",
        rpId: "localhost",
        timeout: 60_000,
        userVerification: "preferred",
        allowCredentials: [],
      },
    }),
  );

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Authenticate with Touch ID" })).toBeDisabled();
  await expect
    .poll(() => page.evaluate(() => (window as Window & { __passkeyCredentialCalls?: number }).__passkeyCredentialCalls ?? 0))
    .toBe(1);
  await page.getByRole("button", { name: "Use a passcode instead" }).click();
  await expect(page.getByPlaceholder("Enter admin passcode")).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { __passkeyAbortCalls?: number }).__passkeyAbortCalls ?? 0)).toBe(1);
});
