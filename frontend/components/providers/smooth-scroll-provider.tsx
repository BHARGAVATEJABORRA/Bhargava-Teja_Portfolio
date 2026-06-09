"use client";

import Lenis from "lenis";
import type { LenisOptions } from "lenis";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { setActiveLenis } from "@/lib/smooth-scroll-instance";

const SCROLL_DURATION = 0.7;
const easeOutExpo = (time: number) => Math.min(1, 1.001 - 2 ** (-10 * time));

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const options = useMemo<LenisOptions>(
    () => ({
      autoRaf: true,
      duration: prefersReducedMotion ? 0 : SCROLL_DURATION,
      easing: easeOutExpo,
      smoothWheel: !prefersReducedMotion,
      syncTouch: false,
      touchMultiplier: 1,
      wheelMultiplier: 1,
      anchors: prefersReducedMotion
        ? { immediate: true }
        : {
            duration: SCROLL_DURATION,
            easing: easeOutExpo,
          },
    }),
    [prefersReducedMotion],
  );

  useEffect(() => {
    const lenis = new Lenis(options);
    const resizeLenis = () => lenis.resize();
    const resizeObserver = new ResizeObserver(resizeLenis);
    const resizeTimeouts = [0, 300, 900, 1600].map((delay) => window.setTimeout(resizeLenis, delay));

    setActiveLenis(lenis);
    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(document.body);
    window.addEventListener("load", resizeLenis);

    return () => {
      if (window.__portfolioLenis === lenis) {
        setActiveLenis(null);
      }

      window.removeEventListener("load", resizeLenis);
      resizeObserver.disconnect();
      resizeTimeouts.forEach((timeout) => window.clearTimeout(timeout));
      lenis.destroy();
    };
  }, [options]);

  return children;
}
