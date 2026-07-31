"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { sendBeacon } from "@/lib/analytics";

/**
 * Sends one first-party pageview beacon per path (cookie-less). Mounted once in
 * the root layout. Admin routes are excluded so internal edits don't inflate
 * public-traffic numbers.
 */
export function PageBeacon() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/login")) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    sendBeacon({
      type: "pageview",
      name: pathname,
      path: pathname,
      referrer: typeof document !== "undefined" ? document.referrer : "",
    });
  }, [pathname]);

  return null;
}
