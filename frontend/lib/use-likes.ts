"use client";

/**
 * Client hook for the real like system (/api/likes).
 *
 * - Anonymous visitor token in localStorage (random UUID, no PII, no cookies).
 * - Loads counts + this visitor's likes once per section on mount.
 * - Optimistic toggle with server reconciliation; if the API is unavailable
 *   (e.g. static export), the button still toggles locally so the UI never
 *   feels broken.
 */

import { useCallback, useEffect, useState } from "react";

export type LikeEntityType = "project" | "article";

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem("pf_like_id");
    if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      id = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem("pf_like_id", id);
    }
    return id;
  } catch {
    return "";
  }
}

/** Stable key for items that only have a title (projects). */
export function likeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function useLikes(type: LikeEntityType) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const visitor = getVisitorId();
    const controller = new AbortController();
    void fetch(`/api/likes?type=${type}${visitor ? `&visitor=${visitor}` : ""}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { counts?: Record<string, number>; liked?: string[] } | null) => {
        if (!data) return;
        setCounts(data.counts ?? {});
        setLiked(Object.fromEntries((data.liked ?? []).map((k) => [k, true])));
      })
      .catch(() => {
        /* API unavailable (static export / offline) — keep local-only likes */
      });
    return () => controller.abort();
  }, [type]);

  const toggle = useCallback(
    (key: string) => {
      const next = !liked[key];
      // Optimistic update.
      setLiked((prev) => ({ ...prev, [key]: next }));
      setCounts((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] ?? 0) + (next ? 1 : -1)) }));

      const visitorId = getVisitorId();
      if (!visitorId) return;
      void fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, key, visitorId, liked: next }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { count?: number } | null) => {
          if (data && typeof data.count === "number") {
            setCounts((prev) => ({ ...prev, [key]: data.count as number }));
          }
        })
        .catch(() => {
          /* keep the optimistic state; next page load reconciles */
        });
    },
    [liked, type],
  );

  return {
    count: (key: string) => counts[key] ?? 0,
    isLiked: (key: string) => liked[key] === true,
    toggle,
  };
}
