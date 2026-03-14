"use client";

import { useState } from "react";

interface CopyEmailButtonProps {
  email: string;
}

export function CopyEmailButton({ email }: CopyEmailButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setStatus("copied");
          window.setTimeout(() => setStatus("idle"), 1800);
        } catch {
          setStatus("error");
        }
      }}
      className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface)]"
      aria-live="polite"
    >
      {status === "idle" ? "Copy email" : status === "copied" ? "Email copied" : "Copy failed"}
    </button>
  );
}
