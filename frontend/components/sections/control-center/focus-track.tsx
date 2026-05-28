"use client";

import { useEffect, useState } from "react";

import { portfolioContent } from "@/content/portfolio-content";

import { WidgetShell } from "./widget-shell";

export function FocusTrack() {
  const baseCoffeeCount = portfolioContent.identity.controlCenter.coffeeCount;
  const [displayCount, setDisplayCount] = useState(baseCoffeeCount);
  const [showIncrement, setShowIncrement] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDisplayCount(baseCoffeeCount + 1);
      setShowIncrement(true);
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [baseCoffeeCount]);

  return (
    <WidgetShell title="Focus Track">
      <div className="flex items-end justify-between gap-3">
        <p className="text-2xl font-bold tabular-nums text-[var(--color-ink)]">{displayCount}</p>
        <span
          className={`text-xs font-semibold text-emerald-500 transition-opacity ${
            showIncrement ? "opacity-100" : "opacity-0"
          }`}
          aria-live="polite"
        >
          +1
        </span>
      </div>
      <p className="text-xs text-[var(--color-muted-ink)]">Coffee-fueled deep work sessions</p>
    </WidgetShell>
  );
}
