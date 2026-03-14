"use client";

import { coreSectionLinks } from "@/lib/site";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[color:var(--color-bg)/0.92] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#hero" className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-ink)]">
          Bhargav Patel
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {coreSectionLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-[var(--color-muted-ink)] transition-colors hover:text-[var(--color-ink)]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new Event("portfolio:open-command-palette"));
            }}
            className="hidden rounded-full border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface)] md:inline-flex"
          >
            Cmd/Ctrl + K
          </button>
          <a
            href="#contact"
            className="rounded-full border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface)]"
          >
            Let&apos;s Talk
          </a>
        </div>
      </div>
    </header>
  );
}
