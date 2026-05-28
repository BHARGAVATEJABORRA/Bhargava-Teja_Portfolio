"use client";

import { useEffect, useMemo, useState } from "react";

import { portfolioContent } from "@/content/portfolio-content";

import { WidgetShell } from "./widget-shell";

export function LocalTimeClock() {
  const [now, setNow] = useState<Date>(() => new Date());
  const timezone = portfolioContent.identity.controlCenter.weatherTimezone;

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
    <WidgetShell title="Local Time">
      <p className="text-2xl font-bold tabular-nums text-[var(--color-ink)]">{timeValue}</p>
      <p className="text-xs text-[var(--color-muted-ink)]">{timezone}</p>
      <div className="h-1 overflow-hidden rounded-full bg-[color:var(--color-border)/0.45]" aria-hidden>
        <div
          className="h-full bg-[var(--color-accent)] transition-[width] duration-700 ease-linear"
          style={{ width: `${(now.getSeconds() / 60) * 100}%` }}
        />
      </div>
    </WidgetShell>
  );
}
