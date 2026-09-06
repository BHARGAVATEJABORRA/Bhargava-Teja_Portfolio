"use client";

import { useEffect, useMemo, useState } from "react";
import { portfolioContent } from "@/content/portfolio-content";

import { ControlCenterPanel } from "./control-center-panel";

export function LocalTimeClock() {
  const [now, setNow] = useState<Date>(() => new Date());
  const timezone = portfolioContent.identity.controlCenter.weatherTimezone;
  const timezoneLabel = portfolioContent.identity.controlCenter.timezone;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const timeParts = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: timezone,
      }).formatToParts(now),
    [now, timezone],
  );
  const clockTime = `${timeParts.find((part) => part.type === "hour")?.value ?? "--"}:${timeParts.find((part) => part.type === "minute")?.value ?? "--"}`;
  const dayPeriod = timeParts.find((part) => part.type === "dayPeriod")?.value ?? "";
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: timezone,
      })
        .format(now)
        .toUpperCase(),
    [now, timezone],
  );
  const activeTick = Math.round((now.getMinutes() / 60) * 48) % 48;

  return (
    <ControlCenterPanel radius={28} className="relative flex h-full min-h-[14rem] flex-col overflow-hidden p-4 sm:p-5">
      <div className="pointer-events-none absolute inset-3 rounded-[1.2rem]" aria-hidden>
        {Array.from({ length: 48 }, (_, index) => (
          <span
            key={index}
            className={`absolute left-1/2 top-1/2 w-px origin-bottom transition-colors duration-500 ${index === activeTick ? "h-4 bg-[var(--color-ink)]" : index % 4 === 0 ? "h-3 bg-black/25 dark:bg-white/35" : "h-2 bg-black/10 dark:bg-white/18"}`}
            style={{ transform: `translate(-50%, -50%) rotate(${index * 7.5}deg) translateY(-5.6rem)` }}
          />
        ))}
      </div>

      <div className="relative z-10 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Local Time</div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center text-center">
        <div className="flex items-start justify-center gap-2">
          <p className="text-[clamp(3.7rem,8vw,5.4rem)] font-semibold leading-none tracking-[-0.09em] tabular-nums text-[var(--color-ink)]">
            {clockTime}
          </p>
          <span className="mt-1.5 text-sm font-semibold tracking-[0.14em] text-[var(--color-muted-ink)]">{dayPeriod}</span>
        </div>
        <p className="mt-5 text-[0.62rem] font-semibold uppercase tracking-[0.19em] text-[var(--color-muted-ink)] sm:text-xs">
          {dateLabel} <span aria-hidden>•</span> {timezoneLabel}
        </p>
      </div>
    </ControlCenterPanel>
  );
}
