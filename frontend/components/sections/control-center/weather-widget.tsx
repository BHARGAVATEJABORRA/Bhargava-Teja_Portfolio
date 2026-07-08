"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import {
  LuCloud,
  LuCloudFog,
  LuCloudRain,
  LuCloudSnow,
  LuCloudSun,
  LuDroplets,
  LuMoon,
  LuSun,
  LuWind,
  LuZap,
} from "react-icons/lu";

import {
  buildOpenMeteoUrl,
  fetchWeatherSnapshot,
  type WeatherKind,
  type WeatherSnapshot,
} from "@/lib/open-meteo";
import { portfolioContent } from "@/content/portfolio-content";

import { ControlCenterPanel } from "./control-center-panel";

const WEATHER_TIMEZONE = portfolioContent.identity.controlCenter.weatherTimezone;
const WEATHER_LOCATION = portfolioContent.identity.controlCenter.weatherLocation;

function currentHourInWeatherTimezone() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: WEATHER_TIMEZONE,
    }).format(new Date()),
  );
  return Number.isFinite(hour) ? hour % 24 : 12;
}

function hourLabel(hour: number) {
  if (hour === 0) return "12am";
  if (hour === 12) return "Noon";
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

function WeatherIcon({
  kind,
  isDay = true,
  size = 18,
  className = "",
}: {
  kind: WeatherKind;
  isDay?: boolean;
  size?: number;
  className?: string;
}) {
  const props = { size, "aria-hidden": true, className } as const;
  switch (kind) {
    case "clear":
      return isDay ? <LuSun {...props} /> : <LuMoon {...props} />;
    case "partly-cloudy":
      return isDay ? <LuCloudSun {...props} /> : <LuMoon {...props} />;
    case "cloudy":
      return <LuCloud {...props} />;
    case "foggy":
      return <LuCloudFog {...props} />;
    case "rainy":
      return <LuCloudRain {...props} />;
    case "snowy":
      return <LuCloudSnow {...props} />;
    case "thunderstorm":
      return <LuZap {...props} />;
  }
}

// ─── Animated sky scene (liquid-glass backdrop) ──────────────────────────────
function SkyScene({ kind, isNight, sunRotation }: { kind: WeatherKind; isNight: boolean; sunRotation: number }) {
  const isRain = kind === "rainy";
  const isSnow = kind === "snowy";
  const isStorm = kind === "thunderstorm";
  const hasClouds = kind === "partly-cloudy" || kind === "cloudy" || kind === "foggy" || isRain || isStorm;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {/* Sky gradient */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: "linear-gradient(180deg,#fefefe 0%,#5bc8f5 60%,#e8f5fe 100%)",
          opacity: isNight ? 0 : 1,
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: "linear-gradient(180deg,#060e22 0%,#1a2d5a 60%,#2d4a7a 100%)",
          opacity: isNight ? 1 : 0,
        }}
      />

      {/* Sun / Moon disc */}
      <div
        className="absolute left-[52%] h-12 w-12 rounded-full transition-all duration-700"
        style={{
          bottom: "56%",
          background: isNight ? "rgba(255,255,255,0.9)" : "#fceabb",
          boxShadow: isNight ? "0 0 18px 5px #ffffff88" : "0 0 32px 10px #fceabb",
          transform: `rotate(${sunRotation}deg)`,
          transformOrigin: "0px 88px",
          opacity: isStorm ? 0.3 : 1,
        }}
      />

      {/* Moon crater overlay */}
      {isNight && (
        <div
          className="absolute left-[52%] h-12 w-12 overflow-hidden rounded-full transition-opacity duration-700"
          style={{ bottom: "56%", transform: `rotate(${sunRotation}deg)`, transformOrigin: "0px 88px" }}
        >
          <div className="absolute -right-1.5 -top-1.5 h-12 w-12 rounded-full bg-[#10213f]" />
        </div>
      )}

      {/* Clouds */}
      {hasClouds && (
        <>
          <div className="weather-cloud weather-cloud-1 absolute left-0 top-[14%] h-6 w-24 rounded-full bg-white/40 blur-[2px]" />
          <div className="weather-cloud weather-cloud-2 absolute left-0 top-[28%] h-7 w-28 rounded-full bg-white/30 blur-[2px]" />
          <div className="weather-cloud weather-cloud-3 absolute left-0 top-[6%]  h-5 w-18 rounded-full bg-white/25 blur-[2px]" />
        </>
      )}

      {/* Stars (clear nights) */}
      {isNight && !hasClouds && (
        <div className="absolute inset-0">
          {[15, 25, 40, 55, 70, 82, 12, 34, 60, 78, 90, 48].map((x, i) => (
            <div
              key={i}
              className="absolute h-0.5 w-0.5 rounded-full bg-white"
              style={{
                left: `${x}%`,
                top: `${[10, 20, 8, 18, 12, 25, 35, 30, 22, 15, 28, 5][i]}%`,
                opacity: 0.6 + (i % 3) * 0.15,
              }}
            />
          ))}
        </div>
      )}

      {/* Rain */}
      {isRain && (
        <div className="absolute inset-0 opacity-70">
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={i}
              className="weather-rain absolute h-6 w-px bg-gradient-to-b from-white/80 to-white/0"
              style={{ left: `${(i * 23) % 100}%`, top: `${(i * 31) % 80}%`, animationDelay: `${i * 0.03}s` }}
            />
          ))}
        </div>
      )}

      {/* Snow */}
      {isSnow && (
        <div className="absolute inset-0 opacity-90">
          {Array.from({ length: 50 }).map((_, i) => (
            <span
              key={i}
              className="weather-snow absolute h-1.5 w-1.5 rounded-full bg-white"
              style={{ left: `${(i * 17) % 100}%`, top: `${(i * 23) % 80}%`, animationDelay: `${i * 0.07}s` }}
            />
          ))}
        </div>
      )}

      {/* Lightning */}
      {isStorm && (
        <div className="weather-lightning absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.9),rgba(255,255,255,0)_60%)]" />
      )}

      {/* Liquid-glass finish: specular top highlight + soft inner edge */}
      <div className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(165deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.06)_28%,rgba(255,255,255,0)_46%)]" />
      <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(255,255,255,0.08)]" />

      <style jsx>{`
        .weather-cloud {
          animation: cloud-drift 28s linear infinite;
        }
        .weather-cloud::before,
        .weather-cloud::after {
          content: "";
          position: absolute;
          border-radius: 9999px;
          background: inherit;
        }
        .weather-cloud::before { width: 45%; height: 140%; left: 18%; top: -70%; }
        .weather-cloud::after  { width: 55%; height: 165%; right: 10%; top: -88%; }
        .weather-cloud-2 { animation-delay: -10s; }
        .weather-cloud-3 { animation-delay: -20s; }
        @keyframes cloud-drift {
          from { transform: translateX(-150%); }
          to   { transform: translateX(700%);  }
        }
        .weather-rain {
          animation: rain-fall 0.4s linear infinite;
        }
        @keyframes rain-fall {
          to { transform: translateY(400px); }
        }
        .weather-snow {
          animation: snow-fall 5s linear infinite;
        }
        @keyframes snow-fall {
          from { transform: translateY(-30px) translateX(0);   }
          to   { transform: translateY(500px) translateX(20px); }
        }
        .weather-lightning {
          opacity: 0;
          animation: lightning 2.8s linear infinite;
        }
        @keyframes lightning {
          0%, 22%, 24%, 27%, 100% { opacity: 0; }
          23%, 26% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function WeatherWidget() {
  const { data, error } = useSWR<WeatherSnapshot>(buildOpenMeteoUrl(), fetchWeatherSnapshot, {
    refreshInterval: 10 * 60_000,
    revalidateOnFocus: true,
    dedupingInterval: 60_000,
  });

  const [nowHour, setNowHour] = useState<number>(12);

  useEffect(() => {
    const update = () => setNowHour(currentHourInWeatherTimezone());
    // First sync happens in a frame callback (not synchronously in the effect)
    // so SSR/static HTML hydrates cleanly before the real local hour applies.
    const frame = window.requestAnimationFrame(update);
    const id = window.setInterval(update, 60_000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(id);
    };
  }, []);

  const isLoading = !data && !error;
  const isNight = data ? !data.isDay : !(nowHour >= 6 && nowHour <= 21);
  const sunRotation = isNight
    ? -90 + ((nowHour < 7 ? nowHour + 24 : nowHour) - 6) * (180 / 8)
    : -90 + (nowHour - 7) * (180 / 15);
  const kind: WeatherKind = data?.kind ?? "partly-cloudy";

  // Foreground colour based on night vs day
  const fg = isNight ? "text-white" : "text-black";
  const fgMuted = isNight ? "text-white/65" : "text-black/55";
  const chip = isNight
    ? "border border-white/15 bg-white/12 text-white/80"
    : "border border-white/45 bg-white/35 text-black/70";
  const chipVal = isNight ? "text-white" : "text-black";

  return (
    <ControlCenterPanel
      radius={28}
      className="relative flex h-[220px] min-w-0 w-full flex-col overflow-hidden border-0 p-0 text-black shadow-[0_10px_28px_rgba(0,0,0,0.14)] lg:h-full"
    >
      {/* Sky animation — always shown once loaded */}
      {!isLoading && <SkyScene kind={kind} isNight={isNight} sunRotation={sunRotation} />}

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <div className="relative z-10 flex h-full flex-col justify-center gap-3 p-5">
          <div className="h-4 w-24 animate-pulse rounded-lg bg-white/30" />
          <div className="h-12 w-32 animate-pulse rounded-xl bg-white/30" />
          <div className="h-3 w-40 animate-pulse rounded-lg bg-white/20" />
        </div>
      )}

      {/* ── Live (or graceful unavailable) ── */}
      {!isLoading && (
        <div className={`relative z-10 flex h-full min-h-0 flex-col p-4 sm:p-5 ${fg}`}>
          {/* Top row: location + condition | big temp */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70">
                {data?.location ?? WEATHER_LOCATION}
              </p>
              <p className={`mt-0.5 text-[11px] leading-tight ${fgMuted}`}>
                {data ? data.condition : "Live weather unavailable"}
              </p>
              {data && (
                <p className={`mt-0.5 text-[10px] tabular-nums ${fgMuted}`}>
                  H {data.todayHighF}° · L {data.todayLowF}°
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-start gap-2">
              <WeatherIcon
                kind={kind}
                isDay={!isNight}
                size={28}
                className={isNight ? "text-white/80" : "text-black/60"}
              />
              <p className="text-[2.6rem] font-bold leading-none tabular-nums sm:text-[3rem]">
                {data ? `${data.tempF}°` : "--"}
              </p>
            </div>
          </div>

          {/* Middle: frosted stat chips */}
          <div className="mt-auto flex gap-2 pt-2">
            <div className={`flex flex-1 items-center gap-1 rounded-2xl px-2.5 py-1.5 text-[10px] backdrop-blur-xl ${chip}`}>
              <LuSun size={11} aria-hidden />
              <span className={`font-bold ${chipVal}`}>{data ? `${data.feelsLikeF}°` : "--"}</span>
              <span>Feels</span>
            </div>
            <div className={`flex flex-1 items-center gap-1 rounded-2xl px-2.5 py-1.5 text-[10px] backdrop-blur-xl ${chip}`}>
              <LuDroplets size={11} aria-hidden />
              <span className={`font-bold ${chipVal}`}>{data ? `${data.humidity}%` : "--"}</span>
              <span>Hum</span>
            </div>
            <div className={`flex flex-1 items-center gap-1 rounded-2xl px-2.5 py-1.5 text-[10px] backdrop-blur-xl ${chip}`}>
              <LuWind size={11} aria-hidden />
              <span className={`font-bold ${chipVal}`}>{data ? data.windMph : "--"}</span>
              <span>mph</span>
            </div>
          </div>

          {/* Bottom: real upcoming hours + tomorrow */}
          <div className="mt-2 flex gap-1">
            {(data?.hours ?? []).map((slot) => (
              <div
                key={slot.time}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] backdrop-blur-xl ${chip}`}
              >
                <span className={fgMuted}>{hourLabel(slot.hour)}</span>
                <WeatherIcon
                  kind={slot.kind}
                  isDay={slot.isDay}
                  size={13}
                  className={isNight ? "text-white/70" : "text-black/60"}
                />
                <span className={`font-semibold tabular-nums ${chipVal}`}>{slot.tempF}°</span>
              </div>
            ))}
            {data && (
              <div className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] backdrop-blur-xl ${chip}`}>
                <span className={fgMuted}>Tmrw</span>
                <WeatherIcon
                  kind={data.tomorrow.kind}
                  size={13}
                  className={isNight ? "text-white/70" : "text-black/60"}
                />
                <span className={`font-semibold tabular-nums ${chipVal}`}>
                  {data.tomorrow.highF}°<span className={fgMuted}>/{data.tomorrow.lowF}°</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </ControlCenterPanel>
  );
}
