import { NextResponse } from "next/server";

import { portfolioContent } from "@/content/portfolio-content";
import { getWeatherEnvConfig } from "@/lib/weather-env";

const { weatherLat, weatherLng, weatherLocation } = portfolioContent.identity.controlCenter;

// OpenWeather refreshes current conditions every ~10 minutes; match that cadence.
export const revalidate = 600;

export type WeatherData = {
  configured: boolean;
  location: string;
  tempF: number | null;
  feelsLikeF: number | null;
  condition: string;
  icon: string;
  humidity: number | null;
  windMph: number | null;
};

const UNAVAILABLE: WeatherData = {
  configured: true,
  location: weatherLocation,
  tempF: null,
  feelsLikeF: null,
  condition: "Unavailable",
  icon: "",
  humidity: null,
  windMph: null,
};

interface OpenWeatherResponse {
  weather?: Array<{ main?: string; description?: string; icon?: string }>;
  main?: { temp?: number; feels_like?: number; humidity?: number };
  wind?: { speed?: number };
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function GET() {
  const { apiKey, isConfigured } = getWeatherEnvConfig();

  if (!isConfigured) {
    return NextResponse.json(
      { ...UNAVAILABLE, configured: false } satisfies WeatherData,
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("lat", String(weatherLat));
    url.searchParams.set("lon", String(weatherLng));
    url.searchParams.set("units", "imperial");
    url.searchParams.set("appid", apiKey);

    const response = await fetch(url, { next: { revalidate } });
    if (!response.ok) {
      throw new Error(`OpenWeather request failed: ${response.status}`);
    }

    const data = (await response.json()) as OpenWeatherResponse;
    const current = data.weather?.[0];
    const description = current?.description ?? current?.main ?? "";

    const payload: WeatherData = {
      configured: true,
      location: weatherLocation,
      tempF: typeof data.main?.temp === "number" ? Math.round(data.main.temp) : null,
      feelsLikeF: typeof data.main?.feels_like === "number" ? Math.round(data.main.feels_like) : null,
      condition: description ? titleCase(description) : "Unknown",
      icon: current?.icon ?? "",
      humidity: typeof data.main?.humidity === "number" ? Math.round(data.main.humidity) : null,
      windMph: typeof data.wind?.speed === "number" ? Math.round(data.wind.speed) : null,
    };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json(UNAVAILABLE, {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
