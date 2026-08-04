"use client";

import { useEffect, type ReactNode } from "react";

import { startScrollRuntime } from "@/lib/scroll-runtime";

// Kept under its original component name to avoid a broad layout API churn.
// Scrolling is now native; this provider owns the one shared scroll scheduler.
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const stopRuntime = startScrollRuntime();
    return stopRuntime;
  }, []);

  return children;
}
