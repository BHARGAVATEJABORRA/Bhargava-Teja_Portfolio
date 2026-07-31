"use client";

import { useEffect } from "react";

import { scrollToSection } from "@/lib/scroll-to-section";

const RELOAD_SCROLL_KEY = "portfolio:reload-scroll-y";
const SETTLE_DELAYS = [250, 800, 1500];

/**
 * Keeps reload and deep-link scroll behavior deterministic after the home page
 * mounts. Tall client-rendered scroll tracks settle progressively, so both
 * destinations are retried after layout changes.
 */
export function HashScroll() {
  useEffect(() => {
    const persistScrollForReload = () => {
      try {
        window.sessionStorage.setItem(RELOAD_SCROLL_KEY, String(window.scrollY));
      } catch {
        // Storage can be unavailable in privacy-restricted browser contexts.
      }
    };

    window.addEventListener("pagehide", persistScrollForReload);

    const hash = window.location.hash.slice(1);
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    let reloadScrollY: number | null = null;
    if (!hash && navigation?.type === "reload") {
      try {
        const storedScrollY = Number(window.sessionStorage.getItem(RELOAD_SCROLL_KEY));
        if (Number.isFinite(storedScrollY) && storedScrollY >= 0) {
          reloadScrollY = storedScrollY;
        }
        window.sessionStorage.removeItem(RELOAD_SCROLL_KEY);
      } catch {
        // Fall back to the browser's native restoration when storage is blocked.
      }
    }

    let cancelled = false;
    const timeouts: number[] = [];
    let targetObserver: MutationObserver | null = null;
    let reloadSizeObserver: ResizeObserver | null = null;
    let reloadSafetyTimeout = 0;

    const stopReloadRestoration = () => {
      reloadSizeObserver?.disconnect();
      reloadSizeObserver = null;
      if (reloadSafetyTimeout) window.clearTimeout(reloadSafetyTimeout);
      reloadSafetyTimeout = 0;
    };

    const scrollToTarget = () => {
      if (cancelled) return;
      if (hash) {
        if (!document.getElementById(hash)) return;
        scrollToSection(hash);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        return;
      }

      if (reloadScrollY !== null) {
        window.scrollTo({ top: reloadScrollY, behavior: "auto" });
        const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        if (maxScrollY >= reloadScrollY - 2) stopReloadRestoration();
      }
    };

    if (hash) {
      // We already captured the explicit destination, so keep the clean home
      // URL after the initial navigation or a brand-triggered refresh.
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    if (hash || reloadScrollY !== null) {
      scrollToTarget();
      SETTLE_DELAYS.forEach((delay) => {
        timeouts.push(window.setTimeout(scrollToTarget, delay));
      });

      // Most page sections mount only after the greeting completes. A deep
      // link can therefore arrive before its target exists; respond to the
      // actual mount instead of assuming a fixed boot duration.
      if (hash && !document.getElementById(hash)) {
        targetObserver = new MutationObserver(() => {
          if (!document.getElementById(hash)) return;
          targetObserver?.disconnect();
          scrollToTarget();
        });
        targetObserver.observe(document.body, { childList: true, subtree: true });
      }

      if (reloadScrollY !== null) {
        // The greeting intentionally defers the long page and footer. Reapply
        // the browser's saved position as its scroll height grows, then stop
        // as soon as the original destination is reachable.
        reloadSizeObserver = new ResizeObserver(scrollToTarget);
        reloadSizeObserver.observe(document.documentElement);
        reloadSafetyTimeout = window.setTimeout(stopReloadRestoration, 5_500);
        scrollToTarget();
      }
    }

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", persistScrollForReload);
      targetObserver?.disconnect();
      stopReloadRestoration();
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, []);

  return null;
}
