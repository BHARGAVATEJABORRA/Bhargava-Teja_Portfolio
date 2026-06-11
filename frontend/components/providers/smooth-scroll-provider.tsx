"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type { LenisOptions } from "lenis";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { setActiveLenis } from "@/lib/smooth-scroll-instance";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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
      // Lenis is driven from gsap's ticker (below) so it shares a clock with
      // ScrollTrigger instead of running its own requestAnimationFrame loop.
      autoRaf: false,
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
    // gsap.ticker time is in seconds; lenis.raf expects milliseconds.
    const lenisRaf = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);
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
      gsap.ticker.remove(lenisRaf);
      lenis.off("scroll", ScrollTrigger.update);
      lenis.destroy();
    };
  }, [options]);

  return children;
}
