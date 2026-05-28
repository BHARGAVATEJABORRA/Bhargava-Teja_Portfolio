"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LuLogIn } from "react-icons/lu";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { portfolioContent } from "@/content/portfolio-content";
import { trackEvent } from "@/lib/analytics";
import { scrollToSection } from "@/lib/scroll-to-section";
import { coreSectionLinks } from "@/lib/site";

function SectionNavigation({
  activeHref,
  source,
  compact = false,
  liquidEnabled = false,
}: {
  activeHref: string | null;
  source: "sticky_header" | "sticky_header_mobile";
  compact?: boolean;
  liquidEnabled?: boolean;
}) {
  return (
    <nav
      aria-label="Section navigation"
      data-compact={compact ? "true" : "false"}
      data-liquid-glass={liquidEnabled ? "on" : "off"}
      className="index-bar-surface index-pill-nav rounded-full p-1.5"
    >
      <span aria-hidden className="index-bar-warp" />

      <ul className="index-pill-list no-scrollbar relative z-[2] flex max-w-full items-center overflow-x-auto">
        {coreSectionLinks.map((item) => {
          const isActive = activeHref === item.href;

          return (
            <li key={`${source}-${item.href}`} className="index-pill-item shrink-0">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                data-active={isActive ? "true" : "false"}
                onClick={(event) => {
                  if (item.href.startsWith("/#")) {
                    event.preventDefault();
                    scrollToSection(item.href.replace("/#", ""));
                  }

                  trackEvent("header_nav_click", { target: item.href, source });
                }}
                className="index-pill-link inline-flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <span aria-hidden className="index-pill-hover-circle" />
                <span className="index-pill-label-stack">
                  <span className="index-pill-label index-pill-label--base">{item.label}</span>
                  <span aria-hidden className="index-pill-label index-pill-label--hover">
                    {item.label}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SiteHeader() {
  const observedSectionIds = useMemo(
    () => ["hero", ...coreSectionLinks.map((item) => item.href.replace("/#", "")).filter((id) => id.length > 0)],
    [],
  );
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const [liquidEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const ua = window.navigator.userAgent;
    const isChromium = /(Chrome|Chromium|Edg)\//.test(ua) && !/Firefox\//.test(ua);
    const hasBackdropFilter = typeof CSS !== "undefined" && CSS.supports("backdrop-filter: blur(1px)");

    return isChromium && hasBackdropFilter;
  });

  useEffect(() => {
    const sections = observedSectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const currentId = visible[0].target.id;
          setActiveHref(currentId === "hero" ? null : `/#${currentId}`);
        }
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0.15, 0.35, 0.6] },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, [observedSectionIds]);

  return (
    <header data-site-header="true" className="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-5">
      <div className="pointer-events-auto relative z-10 flex items-center gap-3">
        <Link
          href="/#hero"
          onClick={(event) => {
            event.preventDefault();
            scrollToSection("hero");
            trackEvent("header_nav_click", { target: "/#hero", source: "brand_refresh" });
          }}
          className="inline-flex h-10 shrink-0 items-center px-1 text-sm font-semibold tracking-tight text-[var(--color-ink)]"
        >
          {portfolioContent.identity.name}
        </Link>

        <div className="ml-auto hidden min-w-0 items-center gap-2 md:flex">
          <div className="min-w-0">
            <SectionNavigation activeHref={activeHref} source="sticky_header" liquidEnabled={liquidEnabled} />
          </div>
          <Link
            href="/login"
            aria-label="Open login page"
            onClick={() => trackEvent("login_icon_click", { source: "sticky_header", target: "/login" })}
            data-liquid-glass="on"
            className="liquid-control inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <LuLogIn size={17} aria-hidden />
          </Link>
          <ThemeToggle buttonClassName="h-10 w-10 min-h-0 min-w-0" />
        </div>

        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <Link
            href="/login"
            aria-label="Open login page"
            onClick={() => trackEvent("login_icon_click", { source: "sticky_header_mobile", target: "/login" })}
            data-liquid-glass="on"
            className="liquid-control inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <LuLogIn size={17} aria-hidden />
          </Link>
          <ThemeToggle buttonClassName="h-10 w-10 min-h-0 min-w-0" />
        </div>
      </div>

      <div className="pointer-events-auto relative z-10 mt-3 md:hidden">
        <SectionNavigation activeHref={activeHref} source="sticky_header_mobile" compact liquidEnabled={liquidEnabled} />
      </div>
    </header>
  );
}
