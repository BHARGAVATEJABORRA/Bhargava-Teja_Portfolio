"use client";

import { useEffect, useMemo, useState } from "react";
import { LuGlobe } from "react-icons/lu";

import { portfolioContent } from "@/content/portfolio-content";

import { WidgetShell } from "./widget-shell";

function utcOffsetLabel(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const part = parts.find((item) => item.type === "timeZoneName")?.value;
    return part ?? "UTC";
  } catch {
    return "UTC";
  }
}

export function LocationCard() {
  const [now, setNow] = useState<Date>(() => new Date());
  const { location, weatherTimezone, timezone } = portfolioContent.identity.controlCenter;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const localTime = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        timeZone: weatherTimezone,
        hour: "2-digit",
        minute: "2-digit",
      }).format(now),
    [now, weatherTimezone],
  );

  return (
    <WidgetShell title="Location">
      <p className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-ink)]">
        <LuGlobe aria-hidden className="text-[var(--color-accent)]" />
        {location}
      </p>
      <p className="text-xs text-[var(--color-muted-ink)]">
        {timezone} · {utcOffsetLabel(weatherTimezone)}
      </p>
      <p className="text-xs text-[var(--color-muted-ink)]">Local time {localTime}</p>
    </WidgetShell>
  );
}
