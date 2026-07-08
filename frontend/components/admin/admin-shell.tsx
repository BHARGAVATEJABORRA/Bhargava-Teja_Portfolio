"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  LuChevronLeft,
  LuExternalLink,
  LuEye,
  LuFolderKanban,
  LuHistory,
  LuLayoutDashboard,
  LuMenu,
  LuNewspaper,
  LuSettings,
  LuShieldCheck,
  LuWrench,
  LuBriefcase,
  LuX,
} from "react-icons/lu";

import { LogoutButton } from "@/components/admin/logout-button";

type NavItem = { href: string; label: string; icon: typeof LuSettings };

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LuLayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: LuFolderKanban },
  { href: "/admin/experience", label: "Experience", icon: LuBriefcase },
  { href: "/admin/skills", label: "Skills", icon: LuWrench },
  { href: "/admin/articles", label: "Articles", icon: LuNewspaper },
  { href: "/admin/activity", label: "Activity", icon: LuHistory },
  { href: "/admin/settings", label: "Settings", icon: LuSettings },
  { href: "/admin/preview", label: "Preview", icon: LuEye },
];

const COLLAPSE_KEY = "admin.sidebar.collapsed";

export function AdminShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const pathname = usePathname();
  // Lazy init from localStorage (client-only; admin route is fully dynamic).
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

  const sidebar = (
    <nav
      aria-label="Admin sections"
      className={`flex h-full flex-col gap-1 ${collapsed ? "w-[68px]" : "w-60"} transition-[width] duration-200`}
    >
      <div className={`mb-2 flex items-center gap-2 px-2 ${collapsed ? "justify-center" : ""}`}>
        <span
          data-liquid-glass="on"
          className="liquid-control inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]"
        >
          <LuShieldCheck size={13} aria-hidden />
          {!collapsed && <span>Admin</span>}
        </span>
      </div>

      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            title={collapsed ? item.label : undefined}
            aria-current={active ? "page" : undefined}
            className={`group inline-flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
              collapsed ? "justify-center" : ""
            } ${
              active
                ? "bg-[var(--color-accent)] text-black"
                : "text-[var(--color-ink)] tint-card-bg-56 hover:opacity-80"
            }`}
          >
            <Icon size={18} aria-hidden className="flex-none" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}

      <div className="mt-auto flex flex-col gap-2 pt-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? "View public site" : undefined}
          className={`inline-flex min-h-11 items-center gap-3 rounded-xl border tint-border-bd-72 tint-card-bg-56 px-3 text-sm font-semibold text-[var(--color-ink)] transition hover:opacity-80 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LuExternalLink size={16} aria-hidden className="flex-none" />
          {!collapsed && <span>View site</span>}
        </a>
        <div className={collapsed ? "flex justify-center" : ""}>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );

  return (
    <main id="main-content" className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-8%] top-[-6%] h-[26rem] w-[26rem] rounded-full bg-[rgba(82,126,255,0.14)] blur-3xl" />
        <div className="absolute bottom-[-14%] left-[18%] h-[22rem] w-[22rem] rounded-full tint-accent-bg-20 blur-3xl" />
      </div>

      <div className="relative z-10 flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen shrink-0 border-r border-white/10 bg-white/[0.03] p-3 backdrop-blur md:flex md:flex-col">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`mb-2 inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-[var(--color-muted-ink)] transition hover:text-[var(--color-ink)] ${
              collapsed ? "justify-center" : "self-end"
            }`}
          >
            <LuChevronLeft size={16} aria-hidden className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
          {sidebar}
        </aside>

        {/* Mobile top bar + drawer */}
        <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open admin menu"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg tint-card-bg-56 px-3 text-sm font-semibold text-[var(--color-ink)]"
          >
            <LuMenu size={18} aria-hidden /> Menu
          </button>
          <span className="text-sm font-semibold text-[var(--color-ink)]">{title}</span>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} aria-hidden />
            <aside className="absolute left-0 top-0 h-full border-r border-white/10 bg-[#0a0f1a] p-3 shadow-2xl">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="mb-2 inline-flex min-h-9 items-center gap-1 self-end rounded-lg px-2 text-sm font-semibold text-[var(--color-muted-ink)]"
              >
                <LuX size={16} aria-hidden /> Close
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        {/* Content */}
        <section className="min-w-0 flex-1 px-5 pb-10 pt-20 sm:px-8 md:pt-10">
          <div className="mx-auto max-w-5xl space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">{title}</h1>
            {description && <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted-ink)] sm:text-base">{description}</p>}
          </div>
          <div className="mx-auto mt-8 max-w-5xl">{children}</div>
        </section>
      </div>
    </main>
  );
}
