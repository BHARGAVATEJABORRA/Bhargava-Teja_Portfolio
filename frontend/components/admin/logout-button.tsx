"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuLogOut } from "react-icons/lu";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/auth/webauthn/logout", { method: "POST" });
        } finally {
          // Sign out returns to the portfolio hero, not the login screen.
          router.push("/");
          router.refresh();
        }
      }}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border tint-border-bd-72 tint-card-bg-56 px-5 text-sm font-semibold text-[var(--color-ink)] transition hover:opacity-80 disabled:opacity-50"
    >
      <LuLogOut size={16} aria-hidden />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
