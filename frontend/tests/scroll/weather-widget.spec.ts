import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { gotoReady, scrollToAndSettle } from "./helpers";

const OUT_DIR = path.join(__dirname, "__output__");

async function stubWeather(page: Page, weatherCode: number, isDay = 1) {
  await page.route("https://api.open-meteo.com/v1/forecast**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        current: {
          time: "2026-08-03T12:00",
          temperature_2m: 82,
          apparent_temperature: 84,
          relative_humidity_2m: 54,
          wind_speed_10m: 9,
          weather_code: weatherCode,
          is_day: isDay,
        },
        hourly: {
          time: ["2026-08-03T12:00", "2026-08-03T13:00", "2026-08-03T14:00", "2026-08-03T15:00", "2026-08-03T16:00", "2026-08-03T17:00", "2026-08-03T18:00"],
          temperature_2m: [82, 83, 83, 81, 79, 77, 75],
          weather_code: Array(7).fill(weatherCode),
          is_day: Array(7).fill(isDay),
        },
        daily: {
          time: ["2026-08-03", "2026-08-04"],
          temperature_2m_max: [85, 87],
          temperature_2m_min: [71, 72],
          weather_code: [weatherCode, weatherCode],
        },
      }),
    });
  });
}

test("weather scene is video-free, pauses offscreen, and keeps its detail interaction", async ({ page }, testInfo) => {
  await stubWeather(page, 2);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await gotoReady(page);

  const weather = page.getByRole("button", { name: "Open Dallas weather details" });
  await weather.scrollIntoViewIfNeeded();
  await expect(weather).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.locator("[data-weather-scene-active='true']")).toHaveCount(1);
  await expect.poll(() => requests.some((url) => /partly-cloudy-atmosphere-v1\.png(?:$|\?)/.test(url))).toBe(true);
  expect(requests.some((url) => /\.webm(?:$|\?)/.test(url))).toBe(false);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await weather.screenshot({
    path: path.join(OUT_DIR, `weather-partly-cloudy-${testInfo.project.name}.png`),
    animations: "disabled",
  });

  await weather.click();
  await expect(page.getByRole("dialog", { name: /weather details/i })).toBeVisible();
  await expect(page.locator(".weather-scene")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /weather details/i })).toHaveCount(0);

  await scrollToAndSettle(page, 0);
  await expect(page.locator("[data-weather-scene-active='false']")).toHaveCount(1);
});

test("night weather renders one moon and honors reduced motion", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await stubWeather(page, 3, 0);
  await gotoReady(page);

  const weather = page.getByRole("button", { name: "Open Dallas weather details" });
  await weather.scrollIntoViewIfNeeded();
  await expect(page.locator(".weather-scene__moon")).toHaveCount(1);
  await expect(page.locator("[data-weather-scene-active='true']")).toHaveCount(0);
  await expect(page.locator("[data-weather-scene-active='false']")).toHaveCount(1);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await weather.screenshot({
    path: path.join(OUT_DIR, `weather-night-${testInfo.project.name}.png`),
    animations: "disabled",
  });
});

test("clear day renders a high-resolution atmosphere plate with an immediate static scene", async ({ page }, testInfo) => {
  await stubWeather(page, 0, 1);
  await gotoReady(page);

  const weather = page.getByRole("button", { name: "Open Dallas weather details" });
  await weather.scrollIntoViewIfNeeded();
  await expect(page.locator("[data-weather-scene-kind='clear']")).toHaveCount(1);
  await expect(page.locator("[data-weather-scene-plate='/weather-scenes/clear-atmosphere-v1.png']")).toHaveCount(1);
  await expect(page.locator(".weather-scene__moon")).toHaveCount(0);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await weather.screenshot({
    path: path.join(OUT_DIR, `weather-clear-day-${testInfo.project.name}.png`),
    animations: "disabled",
  });
});

const CONDITION_CASES = [
  [0, "clear", "clear-atmosphere-v1.png"],
  [2, "partly-cloudy", "partly-cloudy-atmosphere-v1.png"],
  [3, "cloudy", "cloudy-atmosphere-v1.png"],
  [45, "foggy", "fog-atmosphere-v1.png"],
  [63, "rainy", "rain-atmosphere-v1.png"],
  [73, "snowy", "snow-atmosphere-v1.png"],
  [95, "thunderstorm", "thunderstorm-atmosphere-v1.png"],
] as const;

for (const [weatherCode, kind, plate] of CONDITION_CASES) {
  test(`weather code ${weatherCode} uses the correct composited ${kind} atmosphere`, async ({ page }) => {
    await stubWeather(page, weatherCode);
    await gotoReady(page);
    const weather = page.getByRole("button", { name: "Open Dallas weather details" });
    await weather.scrollIntoViewIfNeeded();
    await expect(page.locator(`[data-weather-scene-kind='${kind}']`)).toHaveCount(1);
    await expect(page.locator(`[data-weather-scene-plate='/weather-scenes/${plate}']`)).toHaveCount(1);
  });
}
