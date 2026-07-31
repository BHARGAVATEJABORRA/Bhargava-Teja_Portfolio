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

  const timeValue = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: timezone,
      }).format(now),
    [now, timezone],
  );

  return (
    <ControlCenterPanel radius={28} className="flex h-full flex-col p-4 sm:p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
        Local Time
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
        <p className="text-2xl font-bold tabular-nums text-[var(--color-ink)] sm:text-[1.8rem]">{timeValue}</p>
        <p className="mt-1 text-xs text-[var(--color-muted-ink)]">{timezoneLabel}</p>
      </div>

      <div className="h-1 overflow-hidden rounded-full tint-border-bg-45" aria-hidden>
        <div
          className="h-full bg-[var(--color-accent)] transition-[width] duration-700 ease-linear"
          style={{ width: `${(now.getSeconds() / 60) * 100}%` }}
        />
      </div>
    </ControlCenterPanel>
  );
}
