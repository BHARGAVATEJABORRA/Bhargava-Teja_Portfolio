/**
 * Client-side weather via Open-Meteo — free, keyless, CORS-enabled.
 * Fetched straight from the browser so it keeps working on static hosting
 * (GitHub Pages) where Next.js API routes don't exist.
 */

import { portfolioContent } from "@/content/portfolio-content";

const { weatherLat, weatherLng, weatherTimezone, weatherLocation } =
  portfolioContent.identity.controlCenter;

export type WeatherKind =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "foggy"
  | "rainy"
  | "snowy"
  | "thunderstorm";

export interface HourSlot {
  /** Local ISO time, e.g. "2026-07-07T15:00" */
  time: string;
  hour: number;
  tempF: number;
  kind: WeatherKind;
  isDay: boolean;
}

export interface WeatherSnapshot {
  location: string;
  tempF: number;
  feelsLikeF: number;
  humidity: number;
  windMph: number;
  kind: WeatherKind;
  condition: string;
  isDay: boolean;
  todayHighF: number;
  todayLowF: number;
  hours: HourSlot[];
  tomorrow: { kind: WeatherKind; highF: number; lowF: number };
}

interface OpenMeteoResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
    is_day?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
    is_day?: number[];
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
  };
}

/** WMO weather interpretation codes → simplified kinds + labels. */
export function wmoToKind(code: number): WeatherKind {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly-cloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "foggy";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rainy";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snowy";
  if (code >= 95) return "thunderstorm";
  return "partly-cloudy";
}

const WMO_LABELS: Array<[Set<number>, string]> = [
  [new Set([0]), "Clear sky"],
  [new Set([1]), "Mainly clear"],
  [new Set([2]), "Partly cloudy"],
  [new Set([3]), "Overcast"],
  [new Set([45, 48]), "Foggy"],
  [new Set([51, 53, 55, 56, 57]), "Drizzle"],
  [new Set([61, 63, 65, 66, 67]), "Rain"],
  [new Set([71, 73, 75, 77]), "Snow"],
  [new Set([80, 81, 82]), "Rain showers"],
  [new Set([85, 86]), "Snow showers"],
  [new Set([95]), "Thunderstorm"],
  [new Set([96, 99]), "Thunderstorm with hail"],
];

export function wmoToLabel(code: number): string {
  for (const [codes, label] of WMO_LABELS) {
    if (codes.has(code)) return label;
  }
  return "Partly cloudy";
}

export function buildOpenMeteoUrl(): string {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(weatherLat));
  url.searchParams.set("longitude", String(weatherLng));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
  );
  url.searchParams.set("hourly", "temperature_2m,weather_code,is_day");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");
  url.searchParams.set("timezone", weatherTimezone);
  url.searchParams.set("forecast_days", "2");
  return url.toString();
}

/** Parse the hour from a local ISO string without timezone ambiguity. */
function hourOf(localIso: string): number {
  const hour = Number(localIso.slice(11, 13));
  return Number.isFinite(hour) ? hour : 0;
}

export async function fetchWeatherSnapshot(url: string): Promise<WeatherSnapshot> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
  const data = (await response.json()) as OpenMeteoResponse;

  const current = data.current;
  const hourly = data.hourly;
  const daily = data.daily;
  if (!current || typeof current.temperature_2m !== "number") {
    throw new Error("Open-Meteo returned no current conditions");
  }

  const code = current.weather_code ?? 2;
  const nowIso = current.time ?? "";

  // Upcoming hourly slots (every 3 hours, next ~12h), starting after "now".
  const hours: HourSlot[] = [];
  const times = hourly?.time ?? [];
  const startIndex = Math.max(
    0,
    times.findIndex((t) => t >= nowIso),
  );
  for (let i = startIndex + 3; i < times.length && hours.length < 4; i += 3) {
    hours.push({
      time: times[i],
      hour: hourOf(times[i]),
      tempF: Math.round(hourly?.temperature_2m?.[i] ?? current.temperature_2m),
      kind: wmoToKind(hourly?.weather_code?.[i] ?? code),
      isDay: (hourly?.is_day?.[i] ?? current.is_day ?? 1) === 1,
    });
  }

  return {
    location: weatherLocation,
    tempF: Math.round(current.temperature_2m),
    feelsLikeF: Math.round(current.apparent_temperature ?? current.temperature_2m),
    humidity: Math.round(current.relative_humidity_2m ?? 0),
    windMph: Math.round(current.wind_speed_10m ?? 0),
    kind: wmoToKind(code),
    condition: wmoToLabel(code),
    isDay: (current.is_day ?? 1) === 1,
    todayHighF: Math.round(daily?.temperature_2m_max?.[0] ?? current.temperature_2m),
    todayLowF: Math.round(daily?.temperature_2m_min?.[0] ?? current.temperature_2m),
    hours,
    tomorrow: {
      kind: wmoToKind(daily?.weather_code?.[1] ?? code),
      highF: Math.round(daily?.temperature_2m_max?.[1] ?? current.temperature_2m),
      lowF: Math.round(daily?.temperature_2m_min?.[1] ?? current.temperature_2m),
    },
  };
}
