"use client";

import { useEffect, useState } from "react";

import { portfolioContent } from "@/content/portfolio-content";

import { WidgetShell } from "./widget-shell";

interface WttrResponse {
  current_condition?: Array<{
    temp_F?: string;
    weatherDesc?: Array<{ value?: string }>;
    weatherIconUrl?: Array<{ value?: string }>;
  }>;
}

interface WeatherState {
  tempF: string;
  condition: string;
}

const CACHE_TTL = 10 * 60 * 1000;

function emojiForCondition(condition: string): string {
  const normalized = condition.toLowerCase();

  if (normalized.includes("sun") || normalized.includes("clear")) return "☀️";
  if (normalized.includes("cloud")) return "☁️";
  if (normalized.includes("rain") || normalized.includes("drizzle")) return "🌧️";
  if (normalized.includes("snow") || normalized.includes("sleet")) return "❄️";
  if (normalized.includes("thunder")) return "⛈️";
  if (normalized.includes("mist") || normalized.includes("fog") || normalized.includes("haze")) return "🌫️";

  return "🌤️";
}

export function WeatherWidget() {
  const location = portfolioContent.identity.controlCenter.weatherLocation;
  const cacheKey = `portfolio:weather:${location.toLowerCase()}`;

  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const cachedRaw = window.localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as { timestamp: number; data: WeatherState };
          if (Date.now() - cached.timestamp < CACHE_TTL) {
            if (mounted) {
              setWeather(cached.data);
              setIsLoading(false);
            }
            return;
          }
        }
      } catch {
        // Ignore bad cache.
      }

      try {
        const encodedLocation = encodeURIComponent(location);
        const response = await fetch(`https://wttr.in/${encodedLocation}?format=j1`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Weather unavailable");
        }

        const payload = (await response.json()) as WttrResponse;
        const current = payload.current_condition?.[0];
        const weatherState: WeatherState = {
          tempF: current?.temp_F ?? "--",
          condition: current?.weatherDesc?.[0]?.value ?? "Unknown",
        };

        if (mounted) {
          setWeather(weatherState);
          setIsLoading(false);
        }

        try {
          window.localStorage.setItem(
            cacheKey,
            JSON.stringify({
              timestamp: Date.now(),
              data: weatherState,
            }),
          );
        } catch {
          // Ignore storage failures.
        }
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        if (mounted) {
          setIsLoading(false);
          setError(fetchError instanceof Error ? fetchError.message : "Weather unavailable");
        }
      }
    }

    void load();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [cacheKey, location]);

  return (
    <WidgetShell title="Weather">
      {isLoading ? (
        <div className="space-y-2" aria-label="Loading weather">
          <div className="h-4 animate-pulse rounded bg-[var(--color-border)]" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--color-border)]" />
        </div>
      ) : error || !weather ? (
        <p className="text-sm text-[var(--color-muted-ink)]">{location} · Weather unavailable</p>
      ) : (
        <>
          <p className="text-2xl font-bold tabular-nums text-[var(--color-ink)]">{weather.tempF}°F</p>
          <p className="text-sm text-[var(--color-muted-ink)]">
            <span aria-hidden>{emojiForCondition(weather.condition)} </span>
            {weather.condition}
          </p>
          <p className="text-xs text-[var(--color-muted-ink)]">{location}</p>
        </>
      )}
    </WidgetShell>
  );
}
