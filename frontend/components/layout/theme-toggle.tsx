"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const value = isMounted ? theme ?? "system" : "system";

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)]">
      <span className="sr-only">Theme</span>
      <span aria-hidden>Theme</span>
      <select
        aria-label="Theme mode"
        value={value}
        onChange={(event) => {
          setTheme(event.target.value);
        }}
        className="bg-transparent text-xs font-semibold text-[var(--color-ink)] outline-none"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
