"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuLogIn } from "react-icons/lu";

import { LoginModal } from "@/components/login/login-modal";
import { portfolioContent } from "@/content/portfolio-content";
import { trackEvent } from "@/lib/analytics";
import { scrollToSection } from "@/lib/scroll-to-section";
import { coreSectionLinks } from "@/lib/site";
import { getActiveLenis } from "@/lib/smooth-scroll-instance";

function sectionIdToActiveHref(sectionId: string) {
  return sectionId === "hero" ? null : `/#${sectionId}`;
}

function getViewportHeaderOffset() {
  const header = document.querySelector<HTMLElement>("[data-site-header='true']");

  if (!header) {
    return 0;
  }

  const headerBottom = header.getBoundingClientRect().bottom;

  return Number.isFinite(headerBottom) && headerBottom > 0 ? headerBottom : 0;
}

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
  const [isScrolled, setIsScrolled] = useState(false);
  const manualActiveUntilRef = useRef(0);
  const [liquidEnabled, setLiquidEnabled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const openLogin = useCallback((source: "sticky_header" | "sticky_header_mobile") => {
    trackEvent("login_icon_click", { source, target: "/admin" });
    setLoginOpen(true);
  }, []);

  const syncActiveHrefToViewport = useCallback(() => {
    if (Date.now() < manualActiveUntilRef.current) {
      return;
    }

    const sections = observedSectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) {
      return;
    }

    const headerOffset = getViewportHeaderOffset();
    const anchorY = window.scrollY + headerOffset + Math.max(120, (window.innerHeight - headerOffset) * 0.38);
    let nextId = sections[0]?.id ?? "hero";

    for (const section of sections) {
      const top = section.getBoundingClientRect().top + window.scrollY;
      const bottom = top + section.offsetHeight;

      if (anchorY >= top && anchorY < bottom) {
        nextId = section.id;
        break;
      }

      if (anchorY >= top) {
        nextId = section.id;
      }
    }

    const nextHref = sectionIdToActiveHref(nextId);
    setActiveHref((currentHref) => (currentHref === nextHref ? currentHref : nextHref));
  }, [observedSectionIds]);

  const handleNavigate = useCallback((href: string) => {
    manualActiveUntilRef.current = Date.now() + 900;
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
    const updateScrollState = () => {
      setIsScrolled(window.scrollY > 72);
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrollState);
    };
  }, []);

  useEffect(() => {
    let frameId: number | null = null;

    const requestSync = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        syncActiveHrefToViewport();
      });
    };

    requestSync();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);

    const lenis = getActiveLenis();
    lenis?.on("scroll", requestSync);

    const timeouts = [120, 420, 900].map((delay) => window.setTimeout(requestSync, delay));

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
      lenis?.off("scroll", requestSync);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [syncActiveHrefToViewport]);

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
