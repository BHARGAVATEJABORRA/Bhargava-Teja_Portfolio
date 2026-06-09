import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PW_PORT ?? 3211);

/**
 * Scroll-sync verification harness (see NOTES_diagnosis.md).
 *
 * Default server is the production build (`next start`) so measurements are
 * deterministic; `npm run verify` builds first. Set PW_DEV=1 to point the
 * harness at the webpack dev server instead while iterating.
 */
export default defineConfig({
  testDir: "./tests/scroll",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    contextOptions: { reducedMotion: "no-preference" },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: process.env.PW_DEV
      ? `npm run dev -- --port ${PORT}`
      : `npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true },
    },
  ],
});
