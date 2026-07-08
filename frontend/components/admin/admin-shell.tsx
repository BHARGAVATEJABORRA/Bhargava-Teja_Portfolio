"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LuExternalLink, LuHistory, LuSettings, LuShieldCheck } from "react-icons/lu";

import { LogoutButton } from "@/components/admin/logout-button";

const NAV_ITEMS: { href: string; label: string; icon?: typeof LuSettings }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/experience", label: "Experience" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/activity", label: "Activity", icon: LuHistory },
  { href: "/admin/settings", label: "Settings", icon: LuSettings },
  { href: "/admin/preview", label: "Preview" },
];

export function AdminShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main id="main-content" className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-8%] top-[-6%] h-[26rem] w-[26rem] rounded-full bg-[rgba(82,126,255,0.14)] blur-3xl" />
        <div className="absolute bottom-[-14%] left-[18%] h-[22rem] w-[22rem] rounded-full tint-accent-bg-20 blur-3xl" />
      </div>

      <section className="relative z-10 mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div
            data-liquid-glass="on"
            className="liquid-control inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]"
          >
            <LuShieldCheck size={14} aria-hidden />
            <span>Admin · Passkey verified</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border tint-border-bd-72 tint-card-bg-56 px-5 text-sm font-semibold text-[var(--color-ink)] transition hover:opacity-80"
            >
              <LuExternalLink size={15} aria-hidden />
              View public site
            </a>
            <LogoutButton />
          </div>
        </div>

        <nav aria-label="Admin sections" className="mt-6 flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--color-accent)] text-black"
                    : "border tint-border-bd-72 tint-card-bg-56 text-[var(--color-ink)] hover:opacity-80"
                }`}
              >
                {ItemIcon && <ItemIcon size={14} aria-hidden />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">{title}</h1>
          {description && <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted-ink)] sm:text-base">{description}</p>}
        </div>

        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}
