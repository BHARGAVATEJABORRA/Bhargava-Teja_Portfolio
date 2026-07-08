"use client";

import { useEffect } from "react";

import { getActiveLenis } from "@/lib/smooth-scroll-instance";

/**
 * Scrolls to the URL hash target after the home page mounts. Needed because
 * the page is client-rendered with Lenis smooth scrolling and tall scroll
 * tracks — the browser's native hash jump fires before layout settles, so
 * deep links like /#blogs would otherwise land at the top.
 */
export function HashScroll() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    // Strip the hash from the URL immediately (we already captured the target)
    // so a plain refresh reloads the page at the top instead of re-scrolling
    // back to the section.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    let cancelled = false;
    const timeouts: number[] = [];

    const scrollToTarget = () => {
      if (cancelled) return;
      const target = document.getElementById(hash);
      if (!target) return;
      const lenis = getActiveLenis();
      if (lenis) {
        lenis.scrollTo(target, { immediate: false });
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    // Layout (fonts, canvases, scroll tracks) settles progressively; retry a
    // few times so the final position is correct.
    [250, 800, 1500].forEach((delay) => {
      timeouts.push(window.setTimeout(scrollToTarget, delay));
    });

    return () => {
      cancelled = true;
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, []);

  return null;
}
