"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  LuCloud,
  LuCloudRain,
  LuCloudSnow,
  LuCloudSun,
  LuMoon,
  LuSun,
  LuZap,
} from "react-icons/lu";

import type { WeatherData } from "@/app/api/weather/route";

import { ControlCenterPanel } from "./control-center-panel";

type HourWeather = {
  day: "tod" | "tom";
  hour: number;
  weather:
    | "clear-night"
    | "partly-cloudy-night"
    | "sunny"
    | "partly-cloudy"
    | "cloudy"
    | "foggy"
    | "rainy"
    | "snowy"
    | "thunderstorm";
  temp: number;
  time: string;
};

const hoursData: HourWeather[] = [
  { day: "tod", hour: 0, weather: "clear-night", temp: 11, time: "00:00" },
  { day: "tod", hour: 1, weather: "partly-cloudy-night", temp: 10, time: "01:00" },
  { day: "tod", hour: 2, weather: "rainy", temp: 9, time: "02:00" },
  { day: "tod", hour: 3, weather: "cloudy", temp: 8, time: "03:00" },
  { day: "tod", hour: 4, weather: "partly-cloudy-night", temp: 7, time: "04:00" },
  { day: "tod", hour: 5, weather: "clear-night", temp: 7, time: "05:00" },
  { day: "tod", hour: 6, weather: "sunny", temp: 12, time: "06:00" },
  { day: "tod", hour: 7, weather: "sunny", temp: 12, time: "07:00" },
  { day: "tod", hour: 8, weather: "sunny", temp: 13, time: "08:00" },
  { day: "tod", hour: 9, weather: "partly-cloudy", temp: 14, time: "09:00" },
  { day: "tod", hour: 10, weather: "cloudy", temp: 16, time: "10:00" },
  { day: "tod", hour: 11, weather: "rainy", temp: 17, time: "11:00" },
  { day: "tod", hour: 12, weather: "rainy", temp: 19, time: "12:00" },
  { day: "tod", hour: 13, weather: "rainy", temp: 20, time: "13:00" },
  { day: "tod", hour: 14, weather: "partly-cloudy", temp: 20, time: "14:00" },
  { day: "tod", hour: 15, weather: "partly-cloudy", temp: 20, time: "15:00" },
  { day: "tod", hour: 16, weather: "partly-cloudy", temp: 19, time: "16:00" },
  { day: "tod", hour: 17, weather: "cloudy", temp: 20, time: "17:00" },
  { day: "tod", hour: 18, weather: "cloudy", temp: 19, time: "18:00" },
  { day: "tod", hour: 19, weather: "cloudy", temp: 18, time: "19:00" },
  { day: "tod", hour: 20, weather: "rainy", temp: 17, time: "20:00" },
  { day: "tod", hour: 21, weather: "rainy", temp: 15, time: "21:00" },
  { day: "tod", hour: 22, weather: "rainy", temp: 12, time: "22:00" },
  { day: "tod", hour: 23, weather: "rainy", temp: 10, time: "23:00" },
  { day: "tom", hour: 0, weather: "thunderstorm", temp: 8, time: "00:00" },
  { day: "tom", hour: 1, weather: "thunderstorm", temp: 6, time: "01:00" },
  { day: "tom", hour: 2, weather: "thunderstorm", temp: 4, time: "02:00" },
  { day: "tom", hour: 3, weather: "thunderstorm", temp: 3, time: "03:00" },
  { day: "tom", hour: 4, weather: "thunderstorm", temp: 2, time: "04:00" },
  { day: "tom", hour: 5, weather: "cloudy", temp: 2, time: "05:00" },
  { day: "tom", hour: 6, weather: "cloudy", temp: 0, time: "06:00" },
  { day: "tom", hour: 7, weather: "cloudy", temp: -1, time: "07:00" },
  { day: "tom", hour: 8, weather: "partly-cloudy", temp: -1, time: "08:00" },
  { day: "tom", hour: 9, weather: "partly-cloudy", temp: -1, time: "09:00" },
  { day: "tom", hour: 10, weather: "snowy", temp: 0, time: "10:00" },
  { day: "tom", hour: 11, weather: "snowy", temp: 1, time: "11:00" },
  { day: "tom", hour: 12, weather: "snowy", temp: 1, time: "12:00" },
  { day: "tom", hour: 13, weather: "partly-cloudy", temp: 3, time: "13:00" },
  { day: "tom", hour: 14, weather: "partly-cloudy", temp: 5, time: "14:00" },
  { day: "tom", hour: 15, weather: "cloudy", temp: 7, time: "15:00" },
  { day: "tom", hour: 16, weather: "cloudy", temp: 9, time: "16:00" },
  { day: "tom", hour: 17, weather: "rainy", temp: 9, time: "17:00" },
  { day: "tom", hour: 18, weather: "rainy", temp: 10, time: "18:00" },
  { day: "tom", hour: 19, weather: "cloudy", temp: 10, time: "19:00" },
  { day: "tom", hour: 20, weather: "cloudy", temp: 9, time: "20:00" },
  { day: "tom", hour: 21, weather: "rainy", temp: 8, time: "21:00" },
  { day: "tom", hour: 22, weather: "rainy", temp: 7, time: "22:00" },
  { day: "tom", hour: 23, weather: "rainy", temp: 5, time: "23:00" },
];

const fetcher = async (url: string): Promise<WeatherData> => {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Weather request failed with status ${response.status}`);
  }

  return (await response.json()) as WeatherData;
};

function celsiusToFahrenheit(value: number) {
  return Math.round(value * 1.8 + 32);
}

function readableWeather(value: string) {
  return value.replace(/-/g, " ");
}

function getIconFromWeather(value: string) {
  if (value === "sunny") return "01d";
  if (value === "clear-night") return "01n";
  if (value === "partly-cloudy") return "02d";
  if (value === "partly-cloudy-night") return "02n";
  if (value === "cloudy" || value === "foggy") return "04d";
  if (value === "rainy") return "10d";
  if (value === "snowy") return "13d";
  if (value === "thunderstorm") return "11d";
  return "02d";
}

function WeatherGlyph({ icon, condition, size = 28 }: { icon: string; condition: string; size?: number }) {
  const code = icon.slice(0, 2);
  const isNight = icon.endsWith("n");
  const common = {
    size,
    "aria-hidden": true,
    className: "text-[var(--color-accent)]",
  } as const;

  switch (code) {
    case "01":
      return isNight ? <LuMoon {...common} /> : <LuSun {...common} />;
    case "02":
    case "03":
      return <LuCloudSun {...common} />;
    case "04":
      return <LuCloud {...common} />;
    case "09":
    case "10":
      return <LuCloudRain {...common} />;
    case "11":
      return <LuZap {...common} />;
    case "13":
      return <LuCloudSnow {...common} />;
    default: {
      const normalized = condition.toLowerCase();
      if (normalized.includes("rain") || normalized.includes("drizzle")) return <LuCloudRain {...common} />;
      if (normalized.includes("snow")) return <LuCloudSnow {...common} />;
      if (normalized.includes("cloud")) return <LuCloud {...common} />;
      if (normalized.includes("thunder")) return <LuZap {...common} />;
      return <LuCloudSun {...common} />;
    }
  }
}

function AnimatedWeatherScene({
  condition,
  rotation,
  isNight,
}: {
  condition: string;
  rotation: number;
  isNight: boolean;
}) {
  const normalized = condition.toLowerCase();
  const isRain = normalized.includes("rain");
  const isSnow = normalized.includes("snow");
  const isStorm = normalized.includes("thunder") || normalized.includes("storm");
  const showClouds = normalized.includes("cloud") || normalized.includes("rain") || normalized.includes("storm");

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <div className="absolute inset-0 bg-[linear-gradient(0deg,#fefefe_0%,#00a4e4_74%)] transition-opacity duration-700" style={{ opacity: isNight ? 0 : 1 }} />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,#4c5177_0%,#051428_74%)] transition-opacity duration-700" style={{ opacity: isNight ? 1 : 0 }} />
      <div
        className="absolute left-[52%] bottom-[58%] h-14 w-14 rounded-full bg-[#fceabb] shadow-[0_0_32px_10px_#fceabb] transition-all duration-700"
        style={{ opacity: isNight ? 0 : 1, transform: `rotate(${rotation}deg)`, transformOrigin: "0px 92px" }}
      />
      <div
        className="absolute left-[52%] bottom-[54%] h-14 w-14 rounded-full bg-white/90 shadow-[0_0_18px_5px_#ffffff] transition-all duration-700 before:absolute before:right-[-6px] before:top-[-3px] before:h-14 before:w-14 before:rounded-full before:bg-[#121a35]"
        style={{ opacity: isNight ? 1 : 0, transform: `rotate(${rotation}deg)`, transformOrigin: "0px 92px" }}
      />

      {showClouds ? (
        <>
          <div className="codepen-cloud codepen-cloud-one absolute left-[-16%] top-[24%] h-9 w-28 rounded-full bg-white/75 blur-[1px]" />
          <div className="codepen-cloud codepen-cloud-two absolute left-[30%] top-[42%] h-10 w-32 rounded-full bg-white/60 blur-[1px]" />
          <div className="codepen-cloud codepen-cloud-three absolute right-[-10%] top-[58%] h-8 w-24 rounded-full bg-white/55 blur-[1px]" />
        </>
      ) : null}

      {isRain ? (
        <div className="absolute inset-0 opacity-80">
          {Array.from({ length: 70 }).map((_, index) => (
            <span
              key={index}
              className="rain-line absolute h-8 w-px bg-gradient-to-b from-white/70 to-white/0"
              style={{ left: `${(index * 17) % 100}%`, top: `${(index * 29) % 100}%`, animationDelay: `${index * 0.02}s` }}
            />
          ))}
        </div>
      ) : null}

      {isSnow ? (
        <div className="absolute inset-0 opacity-90">
          {Array.from({ length: 110 }).map((_, index) => (
            <span
              key={index}
              className="snow-dot absolute h-1.5 w-1.5 rounded-full bg-white"
              style={{ left: `${(index * 13) % 100}%`, top: `${(index * 19) % 100}%`, animationDelay: `${index * 0.05}s` }}
            />
          ))}
        </div>
      ) : null}

      {isStorm ? <div className="lightning-flash absolute -top-52 left-0 h-[150%] w-full bg-[radial-gradient(closest-side,rgba(255,255,255,1),rgba(255,255,255,0.5))]" /> : null}

      <style jsx>{`
        .codepen-cloud {
          animation: cloud-slide 11s linear infinite;
          filter: brightness(200%) drop-shadow(0 0 10px rgba(255, 255, 255, 1));
        }

        .codepen-cloud::before,
        .codepen-cloud::after {
          content: "";
          position: absolute;
          border-radius: 9999px;
          background: inherit;
        }

        .codepen-cloud::before {
          width: 45%;
          height: 140%;
          left: 18%;
          top: -70%;
        }

        .codepen-cloud::after {
          width: 55%;
          height: 165%;
          right: 10%;
          top: -88%;
        }

        .codepen-cloud-two {
          animation-delay: -4s;
        }

        .codepen-cloud-three {
          animation-delay: -7s;
        }

        .rain-line {
          animation: rain-fall 0.38s linear infinite;
        }

        .snow-dot {
          animation: snow-fall 4.4s linear infinite;
        }

        .lightning-flash {
          opacity: 0;
          animation: lightning-flash 2.4s linear infinite;
        }

        @keyframes cloud-slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(160%);
          }
        }

        @keyframes rain-fall {
          to {
            transform: translateY(500px);
          }
        }

        @keyframes snow-fall {
          0% {
            transform: translateY(-40px) translateX(0);
          }
          100% {
            transform: translateY(620px) translateX(30px);
          }
        }

        @keyframes lightning-flash {
          0%,
          24%,
          26%,
          29%,
          100% {
            opacity: 0;
          }
          25%,
          28% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export function WeatherWidget() {
  const { data, error } = useSWR("/api/weather", fetcher, {
    refreshInterval: 10 * 60_000,
    revalidateOnFocus: true,
    dedupingInterval: 60_000,
  });
  const [selectedIndex, setSelectedIndex] = useState(11);

  const isLoading = !data && !error;
  const feelsLikeF = typeof data?.feelsLikeF === "number" ? data.feelsLikeF : Number(data?.feelsLikeF);
  const humidity = typeof data?.humidity === "number" ? data.humidity : Number(data?.humidity);
  const windMph = typeof data?.windMph === "number" ? data.windMph : Number(data?.windMph);
  const liveTempF = typeof data?.tempF === "number" ? data.tempF : Number(data?.tempF);
  const hasLiveWeather = data?.configured === true && Number.isFinite(liveTempF);
  const unavailable = Boolean(error) || (data ? !hasLiveWeather : false);

  const selected = hoursData[selectedIndex] ?? hoursData[11];
  const selectedTempF = celsiusToFahrenheit(selected.temp);
  const selectedWeather = selected.weather;
  const selectedDayLabel = selected.day === "tom" ? "Tomorrow" : "Today";
  const isNightSelected = !(selected.hour >= 6 && selected.hour <= 21);
  const liveCondition = data?.condition && data.condition !== "Unavailable" ? data.condition : readableWeather(selectedWeather);
  const displayTempF = Number.isFinite(liveTempF) ? Math.round(liveTempF) : selectedTempF;
  const foregroundClass = isNightSelected ? "text-white" : "text-black";
  const mutedForegroundClass = isNightSelected ? "text-white/72" : "text-black/60";
  const statPanelClass = isNightSelected ? "bg-white/18 text-white/76" : "bg-white/34 text-black/70";
  const statValueClass = isNightSelected ? "text-white" : "text-black";
  const rotation = !isNightSelected
    ? -90 + (selected.hour - 7) * (180 / 15)
    : -90 + ((selected.hour < 7 ? selected.hour + 24 : selected.hour) - 6) * (180 / 8);

  return (
    <ControlCenterPanel radius={28} className="relative flex h-[220px] min-w-0 w-full flex-col overflow-hidden border-0 p-0 text-black shadow-[0_10px_28px_rgba(0,0,0,0.16)] lg:h-full">
      {!unavailable && data ? <AnimatedWeatherScene condition={selectedWeather} rotation={rotation} isNight={isNightSelected} /> : null}

      {isLoading ? (
        <div className="relative z-10 flex h-full flex-col justify-center p-4 sm:p-5" aria-label="Loading weather">
          <div className="h-10 w-28 animate-pulse rounded bg-white/35" />
          <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-white/25" />
        </div>
      ) : unavailable ? (
        <div className="relative z-10 flex h-full flex-col justify-center p-4 sm:p-5">
          <p className="text-sm font-semibold">{data?.location ?? "Weather"}</p>
          <p className="mt-1 text-xs leading-relaxed text-black/60">
            {data?.configured === false
              ? "Add OPENWEATHER_API_KEY to enable live weather."
              : error
                ? "Live weather request failed. Check /api/weather response."
                : "Live weather is unavailable right now."}
          </p>
        </div>
      ) : (
        <div className={`relative z-10 flex h-full min-h-0 flex-col justify-between p-4 sm:p-5 ${foregroundClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{data?.location}</p>
              <p className={`mt-1 text-[11px] font-medium uppercase tracking-[0.16em] ${mutedForegroundClass}`}>
                {selectedDayLabel} {selected.time}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[2rem] font-semibold leading-none tabular-nums sm:text-[2.35rem]">{displayTempF}°F</p>
              <p className="mt-1 max-w-32 truncate text-xs capitalize leading-none sm:max-w-40">{liveCondition}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className={`rounded-2xl px-2 py-1.5 backdrop-blur-xl ${statPanelClass}`}>
              <p className={`font-bold ${statValueClass}`}>{Number.isFinite(feelsLikeF) ? `${Math.round(feelsLikeF)}°` : "--"}</p>
              <p>Feels</p>
            </div>
            <div className={`rounded-2xl px-2 py-1.5 backdrop-blur-xl ${statPanelClass}`}>
              <p className={`font-bold ${statValueClass}`}>{Number.isFinite(humidity) ? `${Math.round(humidity)}%` : "--"}</p>
              <p>Humidity</p>
            </div>
            <div className={`rounded-2xl px-2 py-1.5 backdrop-blur-xl ${statPanelClass}`}>
              <p className={`font-bold ${statValueClass}`}>{Number.isFinite(windMph) ? `${Math.round(windMph)} mph` : "--"}</p>
              <p>Wind</p>
            </div>
          </div>

          <div className="-mx-2 min-w-0 overflow-x-auto whitespace-nowrap px-2 backdrop-blur-[20px]">
            <div className="flex gap-1">
              {hoursData.map((entry, index) => {
                const isActive = index === selectedIndex;
                return (
                  <button
                    key={`${entry.day}-${entry.time}-${index}`}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={`flex h-12 min-w-14 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 text-center text-[11px] transition-colors duration-300 hover:bg-white/30 ${
                      isActive ? (isNightSelected ? "bg-white/25" : "bg-white/70") : "bg-transparent"
                    }`}
                    aria-label={`${entry.day === "tom" ? "Tomorrow" : "Today"} ${entry.time}, ${celsiusToFahrenheit(entry.temp)} degrees, ${readableWeather(entry.weather)}`}
                  >
                    <span className="font-medium tabular-nums">{entry.time}</span>
                    <span className="flex h-6 items-center justify-center">
                      <WeatherGlyph icon={getIconFromWeather(entry.weather)} condition={entry.weather} size={18} />
                    </span>
                    <span className="font-bold">{celsiusToFahrenheit(entry.temp)}°</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </ControlCenterPanel>
  );
}
