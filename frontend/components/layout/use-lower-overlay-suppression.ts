"use client";

import { useEffect, useState } from "react";

const DEFAULT_SELECTORS = ["#contact", "footer"];

export function useLowerOverlaySuppression(selectors: string[] = DEFAULT_SELECTORS): boolean {
  const [isSuppressed, setIsSuppressed] = useState(false);

  useEffect(() => {
    const targets = selectors
      .map((selector) => document.querySelector(selector))
      .filter((target): target is Element => target !== null);

    if (targets.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const shouldSuppress = entries.some((entry) => entry.isIntersecting);
        setIsSuppressed(shouldSuppress);
      },
      {
        threshold: 0.02,
        rootMargin: "0px 0px 180px 0px",
      },
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
    };
  }, [selectors]);

  return isSuppressed;
}
