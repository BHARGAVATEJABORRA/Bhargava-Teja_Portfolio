"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import useSWR from "swr";
import { LuCloud, LuMapPin, LuSearch, LuWind, LuX } from "react-icons/lu";

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

function currentTimeInWeatherTimezone() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: WEATHER_TIMEZONE,
  }).format(new Date());
}

// ─── Animated sky scene (liquid-glass backdrop) ──────────────────────────────
function SkyScene({
  kind,
  isNight,
  sunRotation,
  expanded = false,
}: {
  kind: WeatherKind;
  isNight: boolean;
  sunRotation: number;
  expanded?: boolean;
}) {
  const isRain = kind === "rainy";
  const isSnow = kind === "snowy";
  const isStorm = kind === "thunderstorm";
  const hasClouds = kind === "partly-cloudy" || kind === "cloudy" || kind === "foggy" || isRain || isStorm;
  const cloudOpacity = isNight ? (hasClouds ? 0.38 : 0) : kind === "clear" ? 0.68 : kind === "partly-cloudy" ? 0.82 : 0.96;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {/* Sky gradient */}
      <div
        className="weather-sky-shift absolute inset-0 transition-opacity duration-700"
        style={{
          background: "linear-gradient(180deg,#91a8bd 0%,#bdcbd6 38%,#78b9e6 100%)",
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

      {/* Layered, slowly drifting cloud banks give the live weather-card feel. */}
      {cloudOpacity > 0 && (
        <div className="absolute inset-0" style={{ opacity: cloudOpacity }}>
          <div className="weather-cloud-bank weather-cloud-bank-far" />
          <div className="weather-cloud-bank weather-cloud-bank-mid" />
          <div className="weather-cloud-bank weather-cloud-bank-near" />
        </div>
      )}

      {/* Sun / Moon disc */}
      <div
        className="absolute left-[52%] rounded-full transition-all duration-700"
        style={{
          width: expanded ? "7rem" : "3rem",
          height: expanded ? "7rem" : "3rem",
          bottom: expanded ? "52%" : "56%",
          background: isNight ? "rgba(255,255,255,0.9)" : "#fceabb",
          boxShadow: isNight ? "0 0 18px 5px #ffffff88" : "0 0 32px 10px #fceabb",
          transform: `rotate(${sunRotation}deg)`,
          transformOrigin: expanded ? "0px 12rem" : "0px 88px",
          opacity: isStorm ? 0.3 : 1,
        }}
      />

      {/* Moon crater overlay */}
      {isNight && (
        <div
          className="absolute left-[52%] overflow-hidden rounded-full transition-opacity duration-700"
          style={{
            width: expanded ? "7rem" : "3rem",
            height: expanded ? "7rem" : "3rem",
            bottom: expanded ? "52%" : "56%",
            transform: `rotate(${sunRotation}deg)`,
            transformOrigin: expanded ? "0px 12rem" : "0px 88px",
          }}
        >
          <div className="absolute -right-1.5 -top-1.5 h-full w-full rounded-full bg-[#10213f]" />
        </div>
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
        .weather-sky-shift {
          background-size: 130% 130% !important;
          animation: sky-breathe 20s ease-in-out infinite alternate;
        }
        .weather-cloud-bank {
          position: absolute;
          left: -28%;
          width: 150%;
          border-radius: 9999px;
          background:
            radial-gradient(ellipse at 10% 72%, rgba(255,255,255,0.88) 0 12%, transparent 28%),
            radial-gradient(ellipse at 25% 52%, rgba(255,255,255,0.94) 0 16%, transparent 33%),
            radial-gradient(ellipse at 43% 68%, rgba(245,250,255,0.88) 0 15%, transparent 31%),
            radial-gradient(ellipse at 59% 46%, rgba(255,255,255,0.9) 0 18%, transparent 35%),
            radial-gradient(ellipse at 78% 68%, rgba(243,249,255,0.86) 0 17%, transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,0.68), rgba(222,235,247,0.28));
          filter: blur(9px);
          will-change: transform;
        }
        .weather-cloud-bank-far {
          top: -7%;
          height: 43%;
          opacity: 0.55;
          animation: cloud-bank-drift 48s ease-in-out infinite alternate;
        }
        .weather-cloud-bank-mid {
          top: 10%;
          height: 52%;
          opacity: 0.72;
          animation: cloud-bank-drift 38s ease-in-out -15s infinite alternate-reverse;
        }
        .weather-cloud-bank-near {
          top: 31%;
          height: 58%;
          opacity: 0.62;
          filter: blur(12px);
          animation: cloud-bank-drift 31s ease-in-out -7s infinite alternate;
        }
        @keyframes sky-breathe {
          from { background-position: 50% 0%; }
          to { background-position: 50% 100%; }
        }
        @keyframes cloud-bank-drift {
          from { transform: translate3d(-7%, 0, 0) scale(1.02); }
          to { transform: translate3d(12%, -3%, 0) scale(1.08); }
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
        @media (prefers-reduced-motion: reduce) {
          .weather-sky-shift,
          .weather-cloud-bank,
          .weather-rain,
          .weather-snow,
          .weather-lightning {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

function hourLabel(hour: number) {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function WeatherDetailCard({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-white/16 bg-white/[0.11] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl transition hover:bg-white/[0.15] ${className}`}>
      <p className="text-[0.63rem] font-semibold uppercase tracking-[0.18em] text-white/58">{label}</p>
      <div className="mt-3">{children}</div>
    </section>
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
  const [localTime, setLocalTime] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      setNowHour(currentHourInWeatherTimezone());
      setLocalTime(currentTimeInWeatherTimezone());
    };
    const frame = window.requestAnimationFrame(update);
    const id = window.setInterval(update, 60_000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const isLoading = !data && !error;
  const isNight = data ? !data.isDay : !(nowHour >= 6 && nowHour <= 21);
  const sunRotation = isNight
    ? -90 + ((nowHour < 7 ? nowHour + 24 : nowHour) - 6) * (180 / 8)
    : -90 + (nowHour - 7) * (180 / 15);
  const kind: WeatherKind = data?.kind ?? "partly-cloudy";
  const forecast = data
    ? [{ hour: nowHour, tempF: data.tempF, kind: data.kind, isDay: data.isDay, now: true }, ...data.hours]
    : [];

  const compactCard = (
    <motion.button
      type="button"
      layoutId="dallas-weather-surface"
      onClick={() => setIsOpen(true)}
      className="block h-full w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      aria-label="Open Dallas weather details"
      transition={{ type: "spring", stiffness: 270, damping: 28 }}
    >
      <ControlCenterPanel
        radius={28}
        className="relative flex h-[220px] min-w-0 w-full flex-col overflow-hidden border-0 p-0 text-white shadow-[0_10px_28px_rgba(0,0,0,0.14)] lg:h-full"
      >
        {!isLoading && <SkyScene kind={kind} isNight={isNight} sunRotation={sunRotation} />}
        {!isLoading && <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,20,38,0.3),rgba(8,38,63,0.02)_52%,rgba(7,27,48,0.22))]" />}

        {isLoading ? (
          <div className="relative z-10 flex h-full flex-col justify-center gap-3 p-5">
            <div className="h-4 w-24 animate-pulse rounded-lg bg-white/30" />
            <div className="h-12 w-32 animate-pulse rounded-xl bg-white/30" />
            <div className="h-3 w-40 animate-pulse rounded-lg bg-white/20" />
          </div>
        ) : (
          <div className="relative z-10 flex h-full min-h-0 flex-col p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-2xl font-semibold tracking-[-0.04em] text-white sm:text-[1.75rem]">
                  {data?.location ?? WEATHER_LOCATION}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-white/88">{localTime || "--:--"}</p>
              </div>
              <p className="shrink-0 text-[4.25rem] font-light leading-[0.82] tracking-[-0.08em] tabular-nums text-white sm:text-[4.75rem]">
                {data ? `${data.tempF}°` : "--"}
              </p>
            </div>
            <div className="mt-auto flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white/95 sm:text-lg">{data?.condition ?? "Weather unavailable"}</p>
                <p className="mt-1 truncate text-xs font-medium text-white/72">{data ? `Feels like ${data.feelsLikeF}° · Tap for details` : "Tap to retry"}</p>
              </div>
              {data && <p className="shrink-0 text-sm font-semibold tabular-nums text-white/92 sm:text-base">H:{data.todayHighF}° L:{data.todayLowF}°</p>}
            </div>
          </div>
        )}
      </ControlCenterPanel>
    </motion.button>
  );

  const weatherWindow = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020711]/70 p-3 backdrop-blur-md sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
          role="presentation"
        >
          <motion.section
            layoutId="dallas-weather-surface"
            transition={{ type: "spring", stiffness: 270, damping: 28 }}
            className="relative flex h-[min(46rem,calc(100dvh-1.5rem))] w-[min(68rem,100%)] overflow-hidden rounded-[1.65rem] border border-white/16 bg-[#0d1d31] text-white shadow-[0_32px_100px_rgba(0,0,0,0.55)] sm:h-[min(46rem,calc(100dvh-3rem))]"
            role="dialog"
            aria-modal="true"
            aria-label={`${data?.location ?? WEATHER_LOCATION} weather details`}
          >
            <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#05111e]/62 p-5 backdrop-blur-2xl md:flex">
              <div className="flex items-center gap-2" aria-hidden>
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="mt-7 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-3 py-2 text-white/55">
                <LuSearch size={15} aria-hidden />
                <span className="text-xs">Saved city</span>
              </div>
              <button type="button" className="mt-4 rounded-2xl border border-white/18 bg-white/[0.14] p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]" aria-current="true">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold">{data?.location ?? WEATHER_LOCATION}</span>
                  <span className="text-xl font-light tabular-nums">{data ? `${data.tempF}°` : "--"}</span>
                </div>
                <p className="mt-1 text-xs text-white/65">{data?.condition ?? "Loading weather"}</p>
                {data && <p className="mt-2 text-[0.68rem] font-medium text-white/72">H:{data.todayHighF}° L:{data.todayLowF}°</p>}
              </button>
              <p className="mt-auto text-xs leading-relaxed text-white/42">Live weather powered by Open-Meteo. Press Esc to close.</p>
            </aside>

            <div className="relative min-w-0 flex-1 overflow-hidden">
              <SkyScene kind={kind} isNight={isNight} sunRotation={sunRotation} expanded />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,13,28,0.36),rgba(4,18,32,0.04)_42%,rgba(4,16,28,0.6))]" />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-[#07111e]/40 text-white backdrop-blur-xl transition hover:bg-white/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="Close weather details"
              >
                <LuX size={20} aria-hidden />
              </button>

              <main className="relative z-10 h-full overflow-y-auto overscroll-contain px-5 pb-8 pt-6 sm:px-8 sm:pb-10 sm:pt-8">
                <div className="max-w-3xl">
                  <div className="flex items-start justify-between gap-4 pr-12">
                    <div>
                      <div className="flex items-center gap-2 text-white/72"><LuMapPin size={15} aria-hidden /><span className="text-sm">{data?.location ?? WEATHER_LOCATION}</span></div>
                      <p className="mt-2 text-sm text-white/68">{localTime || "--:--"} · {data?.condition ?? "Live weather"}</p>
                    </div>
                    <p className="text-7xl font-light leading-none tracking-[-0.08em] tabular-nums text-white sm:text-8xl">{data ? `${data.tempF}°` : "--"}</p>
                  </div>
                  {data && <p className="mt-3 text-base text-white/84">Feels like {data.feelsLikeF}° · H:{data.todayHighF}° L:{data.todayLowF}°</p>}

                  <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <WeatherDetailCard label="Hourly forecast" className="sm:col-span-2 xl:col-span-3">
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {forecast.map((slot, index) => (
                          <div key={`${slot.hour}-${index}`} className="min-w-16 rounded-xl bg-white/[0.08] px-3 py-2.5 text-center">
                            <p className="text-[0.68rem] text-white/65">{"now" in slot && slot.now ? "Now" : hourLabel(slot.hour)}</p>
                            <LuCloud className="mx-auto my-2 text-white/85" size={18} aria-hidden />
                            <p className="text-sm font-semibold tabular-nums">{slot.tempF}°</p>
                          </div>
                        ))}
                      </div>
                    </WeatherDetailCard>

                    <WeatherDetailCard label="Humidity">
                      <p className="text-3xl font-light tabular-nums">{data?.humidity ?? "--"}%</p>
                      <p className="mt-1 text-xs text-white/65">Current relative humidity</p>
                    </WeatherDetailCard>
                    <WeatherDetailCard label="Wind">
                      <div className="flex items-center gap-3"><LuWind size={27} className="text-white/85" aria-hidden /><div><p className="text-2xl font-light tabular-nums">{data?.windMph ?? "--"} <span className="text-sm">mph</span></p><p className="text-xs text-white/65">Surface wind</p></div></div>
                    </WeatherDetailCard>
                    <WeatherDetailCard label="Tomorrow">
                      <p className="text-xl font-light tabular-nums">{data ? `${data.tomorrow.highF}° / ${data.tomorrow.lowF}°` : "--"}</p>
                      <p className="mt-1 text-xs text-white/65">{data?.tomorrow.kind ?? "Forecast loading"}</p>
                    </WeatherDetailCard>
                    <WeatherDetailCard label="Feels like" className="sm:col-span-2 xl:col-span-1">
                      <p className="text-3xl font-light tabular-nums">{data ? `${data.feelsLikeF}°` : "--"}</p>
                      <p className="mt-1 text-xs text-white/65">How it feels outdoors now</p>
                    </WeatherDetailCard>
                  </div>
                </div>
              </main>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <LayoutGroup id="dallas-weather">
      {!isOpen && compactCard}
      {typeof document !== "undefined" ? createPortal(weatherWindow, document.body) : null}
    </LayoutGroup>
  );
}
