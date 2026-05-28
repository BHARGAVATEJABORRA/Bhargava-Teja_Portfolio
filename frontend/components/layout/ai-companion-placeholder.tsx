"use client";

import { useEffect, useState } from "react";
import { LuSparkles } from "react-icons/lu";

import { trackEvent } from "@/lib/analytics";

import { useLowerOverlaySuppression } from "@/components/layout/use-lower-overlay-suppression";

export function AiCompanionPlaceholder() {
  const [isMessageVisible, setIsMessageVisible] = useState(false);
  const isSuppressed = useLowerOverlaySuppression();

  useEffect(() => {
    if (!isMessageVisible) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsMessageVisible(false);
    }, 2400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isMessageVisible]);

  return (
    <aside
      aria-label="AI companion placeholder"
      className={`fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] right-4 z-40 transition-all duration-200 sm:bottom-5 sm:right-5 ${
        isSuppressed ? "pointer-events-none translate-y-3 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      {isMessageVisible ? (
        <p
          data-liquid-glass="on"
          className="liquid-control mb-2 max-w-[220px] rounded-full px-3 py-2 text-xs text-[var(--color-muted-ink)]"
          role="status"
          aria-live="polite"
        >
          AI companion will be enabled in Phase 2 after content validation.
        </p>
      ) : null}

      <button
        type="button"
        aria-label="AI companion placeholder (Phase 2)"
        title="AI companion (Phase 2)"
        onClick={() => {
          setIsMessageVisible((current) => {
            const next = !current;
            trackEvent("ai_placeholder_click", { visible: next });
            return next;
          });
        }}
        data-liquid-glass="on"
        className="liquid-control inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[var(--color-ink)]"
      >
        <LuSparkles size={17} aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-[0.14em]">AI</span>
      </button>
    </aside>
  );
}
