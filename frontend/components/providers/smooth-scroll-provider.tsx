"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, type ReactNode } from "react";

import { startScrollRuntime, subscribeToScrollWrite } from "@/lib/scroll-runtime";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Kept under its original component name to avoid a broad layout API churn.
// Scrolling is now native; this provider owns the one shared scroll scheduler.
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const stopRuntime = startScrollRuntime();
    // Restore GSAP's normal lag smoothing now that no interpolated scroll
    // engine shares its ticker. ScrollTrigger updates in the write phase.
    gsap.ticker.lagSmoothing(500, 33);
    const unsubscribe = subscribeToScrollWrite(() => ScrollTrigger.update());
    ScrollTrigger.refresh();

    return () => {
      unsubscribe();
      stopRuntime();
    };
  }, []);

  return children;
}
