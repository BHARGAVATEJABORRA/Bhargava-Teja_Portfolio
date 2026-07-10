/**
 * /api/weather — server-side weather snapshot.
 *
 * Note: the hero control-center WeatherWidget fetches Open-Meteo client-side
 * (lib/open-meteo.ts); this route exists as a stable server endpoint for
 * anything else that wants weather without a browser CORS dance.
 *
 * Uses OpenWeatherMap when OPENWEATHER_API_KEY is set, otherwise falls back
 * to the key-less wttr.in JSON API. City comes from WEATHER_CITY (default
 * "Hyderabad"). Never throws — errors return a graceful fallback payload.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WeatherPayload = {
  temp: number | null;
  condition: string;
  icon: string;
  city: string;
  source: "openweathermap" | "wttr.in" | "unavailable";
};

const CACHE_HEADERS = { "Cache-Control": "s-maxage=600, stale-while-revalidate=300" };

function fallback(city: string): WeatherPayload {
  return { temp: null, condition: "Unavailable", icon: "", city, source: "unavailable" };
}

async function fromOpenWeatherMap(city: string, apiKey: string): Promise<WeatherPayload | null> {
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("q", city);
  url.searchParams.set("units", "metric");
  url.searchParams.set("appid", apiKey);

  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    main?: { temp?: number };
    weather?: Array<{ main?: string; icon?: string }>;
    name?: string;
  };
  if (typeof data.main?.temp !== "number") return null;

  const icon = data.weather?.[0]?.icon;
  return {
    temp: Math.round(data.main.temp),
    condition: data.weather?.[0]?.main ?? "Unknown",
    icon: icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : "",
    city: data.name || city,
    source: "openweathermap",
  };
}

async function fromWttr(city: string): Promise<WeatherPayload | null> {
  const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
    headers: { "User-Agent": "curl/8" }, // wttr.in returns HTML without a curl-ish UA
    next: { revalidate: 600 },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    current_condition?: Array<{
      temp_C?: string;
      weatherDesc?: Array<{ value?: string }>;
    }>;
  };
  const current = data.current_condition?.[0];
  if (!current?.temp_C) return null;

  return {
    temp: Number.parseInt(current.temp_C, 10),
    condition: current.weatherDesc?.[0]?.value ?? "Unknown",
    icon: "",
    city,
    source: "wttr.in",
  };
}

export async function GET() {
  const city = process.env.WEATHER_CITY?.trim() || "Hyderabad";
  const apiKey = process.env.OPENWEATHER_API_KEY?.trim() || "";

  try {
    const payload =
      (apiKey ? await fromOpenWeatherMap(city, apiKey).catch(() => null) : null) ??
      (await fromWttr(city).catch(() => null)) ??
      fallback(city);

    return NextResponse.json(payload, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json(fallback(city), { headers: { "Cache-Control": "no-store" } });
  }
}
