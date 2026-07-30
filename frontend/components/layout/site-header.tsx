"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LuLogIn } from "react-icons/lu";

import { LoginModal } from "@/components/login/login-modal";
import { portfolioContent } from "@/content/portfolio-content";
import { trackEvent } from "@/lib/analytics";
import { scrollToSection } from "@/lib/scroll-to-section";
import { coreSectionLinks } from "@/lib/site";
import { subscribeToScrollRead } from "@/lib/scroll-runtime";

function SectionNavigation({
  activeHref,
  source,
  onNavigate,
  compact = false,
  liquidEnabled = false,
  isScrolled = false,
}: {
  activeHref: string | null;
  source: "sticky_header" | "sticky_header_mobile";
  onNavigate: (href: string) => void;
  compact?: boolean;
  liquidEnabled?: boolean;
  isScrolled?: boolean;
}) {
  return (
    <nav
      aria-label="Section navigation"
      data-compact={compact ? "true" : "false"}
      data-liquid-glass={liquidEnabled ? "on" : "off"}
      data-scrolled={isScrolled ? "true" : "false"}
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
                    onNavigate(item.href);
                    scrollToSection(item.href.replace("/#", ""));
                  }

                  trackEvent("header_nav_click", { target: item.href, source });
                }}
                className="index-pill-link inline-flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <span aria-hidden className="index-pill-hover-circle" />
                {/* Tailwind grid utilities double up the .index-pill-label-stack
                    rules so the base + hover copies always overlay in one grid
                    cell — without them a missed custom rule renders the label
                    text twice side-by-side ("AboutAbout"). */}
                <span className="index-pill-label-stack inline-grid place-items-center">
                  <span className="index-pill-label index-pill-label--base col-start-1 row-start-1">{item.label}</span>
                  <span aria-hidden className="index-pill-label index-pill-label--hover col-start-1 row-start-1 opacity-0">
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [liquidEnabled, setLiquidEnabled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const openLogin = useCallback((source: "sticky_header" | "sticky_header_mobile") => {
    trackEvent("login_icon_click", { source, target: "/admin" });
    setLoginOpen(true);
  }, []);

  const handleNavigate = useCallback((href: string) => {
    setActiveHref(href);
  }, []);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isChromium = /(Chrome|Chromium|Edg)\//.test(ua) && !/Firefox\//.test(ua);
    const hasBackdropFilter = typeof CSS !== "undefined" && CSS.supports("backdrop-filter: blur(1px)");
    const frameId = window.requestAnimationFrame(() => {
      setLiquidEnabled(isChromium && hasBackdropFilter);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    return subscribeToScrollRead(({ y }) => {
      const next = y > 72;
      setIsScrolled((current) => (current === next ? current : next));
    });
  }, []);

  useEffect(() => {
    const intersecting = new Map<string, IntersectionObserverEntry>();
    const syncActiveSection = () => {
      const candidates = [...intersecting.values()].filter((entry) => entry.isIntersecting);
      if (candidates.length === 0) return;
      const closest = candidates.sort(
        (a, b) =>
          Math.abs(a.boundingClientRect.top - window.innerHeight * 0.38) -
          Math.abs(b.boundingClientRect.top - window.innerHeight * 0.38),
      )[0];
      const id = (closest?.target as HTMLElement | undefined)?.id;
      const nextHref = id && id !== "hero" ? `/#${id}` : null;
      setActiveHref((current) => (current === nextHref ? current : nextHref));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => intersecting.set((entry.target as HTMLElement).id, entry));
        syncActiveSection();
      },
      // This centered band is equivalent to the old header-offset anchor but
      // avoids reading every section's layout on every scroll frame.
      { rootMargin: "-18% 0px -52% 0px", threshold: 0 },
    );

    observedSectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, [observedSectionIds]);

  return (
    <header
      data-site-header="true"
      data-scrolled={isScrolled ? "true" : "false"}
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] translate-y-0 px-4 pt-4 opacity-100 transition-all duration-500 sm:px-5"
    >
      <div className="pointer-events-auto relative z-10 flex items-center gap-3">
        <Link
          href="/#hero"
          onClick={(event) => {
            event.preventDefault();
            // act as a refresh button
            window.location.reload();
            trackEvent("header_nav_click", { target: "/#hero", source: "brand_refresh" });
          }}
          className="inline-flex h-10 shrink-0 items-center px-1 text-sm font-semibold tracking-tight text-[var(--color-ink)]"
        >
          <span className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">{portfolioContent.identity.name}</span>
        </Link>

        <div className="ml-auto hidden min-w-0 items-center gap-2 md:flex">
          <div className="min-w-0">
            <SectionNavigation
              activeHref={activeHref}
              source="sticky_header"
              onNavigate={handleNavigate}
              liquidEnabled={liquidEnabled}
              isScrolled={isScrolled}
            />
          </div>
          <button
            type="button"
            aria-label="Open secure login"
            aria-haspopup="dialog"
            aria-expanded={loginOpen}
            onClick={() => openLogin("sticky_header")}
            data-liquid-glass="on"
            className="liquid-control inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <LuLogIn size={17} aria-hidden />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <button
            type="button"
            aria-label="Open secure login"
            aria-haspopup="dialog"
            aria-expanded={loginOpen}
            onClick={() => openLogin("sticky_header_mobile")}
            data-liquid-glass="on"
            className="liquid-control inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <LuLogIn size={17} aria-hidden />
          </button>
        </div>
      </div>

      <div className="pointer-events-auto">
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>

      <div className="pointer-events-auto relative z-10 mt-3 md:hidden">
        <SectionNavigation
          activeHref={activeHref}
          source="sticky_header_mobile"
          onNavigate={handleNavigate}
          compact
          liquidEnabled={liquidEnabled}
          isScrolled={isScrolled}
        />
      </div>
    </header>
  );
}
