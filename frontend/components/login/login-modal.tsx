"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { LuX } from "react-icons/lu";
import { browserSupportsWebAuthn, startAuthentication, WebAuthnAbortService } from "@simplewebauthn/browser";

import ReflectiveCard, { type ReflectiveAuthStatus } from "@/components/login/reflective-card/ReflectiveCard";

async function postJSON(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error || `Request failed (${res.status})`);
  }
  return data;
}

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  /** Where to go after a successful passkey verification. */
  redirectTo?: string;
};

export function LoginModal({ open, onClose, redirectTo = "/admin" }: LoginModalProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ReflectiveAuthStatus>("idle");
  const [message, setMessage] = useState<string>("Waiting for Touch ID…");
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [clientReady, setClientReady] = useState(false);
  const autoStartedRef = useRef(false);
  const authenticationInFlightRef = useRef(false);
  // A monotonically increasing token means an async ceremony that was
  // cancelled, closed, or replaced can never overwrite the newer UI state.
  const authenticationAttemptRef = useRef(0);
  const openRef = useRef(open);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    setClientReady(true);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    openRef.current = open;
    if (!open) {
      authenticationAttemptRef.current += 1;
      WebAuthnAbortService.cancelCeremony();
      autoStartedRef.current = false;
      authenticationInFlightRef.current = false;
    }
  }, [open]);

  const goToAdmin = useCallback(() => {
    setStatus("success");
    setMessage("Access granted — opening dashboard");
    setTimeout(() => {
      router.push(redirectTo);
      router.refresh();
    }, 550);
  }, [router, redirectTo]);

  const close = useCallback(() => {
    authenticationAttemptRef.current += 1;
    WebAuthnAbortService.cancelCeremony();
    authenticationInFlightRef.current = false;
    // Reset transient state on close so the next open starts clean.
    setStatus("idle");
    setMessage("Waiting for Touch ID…");
    setShowPasscode(false);
    setPasscode("");
    onClose();
  }, [onClose]);

  const showPasscodeFallback = useCallback(() => {
    // The browser's authentication sheet is deliberately cancelled before the
    // passcode input appears. Without this, a pending automatic Touch ID
    // request can keep the fallback visually available but unusable.
    authenticationAttemptRef.current += 1;
    WebAuthnAbortService.cancelCeremony();
    authenticationInFlightRef.current = false;
    setStatus("idle");
    setShowPasscode(true);
    setMessage("Sign in with your passcode instead.");
  }, []);

  const submitPasscode = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (status === "authenticating") return;
      setStatus("authenticating");
      setMessage("Checking passcode…");
      try {
        await postJSON("/api/auth/admin/passcode", { passcode });
        goToAdmin();
      } catch (err) {
        setStatus("error");
        setMessage((err as Error)?.message || "Incorrect passcode.");
      }
    },
    [passcode, status, goToAdmin],
  );

  // Lock body scroll + Escape to close while open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const handleFingerprint = useCallback(async () => {
    if (status === "authenticating" || authenticationInFlightRef.current) return;
    authenticationInFlightRef.current = true;
    const attempt = ++authenticationAttemptRef.current;
    const isCurrentAttempt = () =>
      attempt === authenticationAttemptRef.current && openRef.current && mountedRef.current;

    if (!browserSupportsWebAuthn()) {
      if (!isCurrentAttempt()) return;
      setStatus("idle");
      setShowPasscode(true);
      setMessage("This browser doesn't support passkeys. Sign in with your passcode.");
      authenticationInFlightRef.current = false;
      return;
    }

    setStatus("authenticating");
    setMessage("Waiting for Touch ID…");

    try {
      const statusResponse = await fetch("/api/auth/webauthn/status", { cache: "no-store" });
      if (!statusResponse.ok) throw new Error("Could not check passkey availability.");
      const { registered } = (await statusResponse.json()) as {
        registered: boolean;
      };
      if (!isCurrentAttempt()) return;

      // No passkey is enrolled yet — registration is admin-only, so the passcode
      // is the only way in. Enroll Touch ID from the dashboard once signed in.
      if (!registered) {
        setStatus("idle");
        setShowPasscode(true);
        setMessage("Sign in with your passcode — you can enable Touch ID from the dashboard afterward.");
        return;
      }

      const optionsJSON = await postJSON("/api/auth/webauthn/authenticate/options");
      if (!isCurrentAttempt()) return;
      const assertion = await startAuthentication({ optionsJSON });
      if (!isCurrentAttempt()) return;
      await postJSON("/api/auth/webauthn/authenticate/verify", assertion);
      if (!isCurrentAttempt()) return;

      goToAdmin();
    } catch (err) {
      if (!isCurrentAttempt()) return;
      const name = (err as { name?: string })?.name;
      const friendly =
        name === "NotAllowedError"
          ? "Touch ID was cancelled or timed out."
          : (err as Error)?.message || "Authentication failed.";
      setStatus("error");
      setMessage(friendly);
    } finally {
      if (isCurrentAttempt()) authenticationInFlightRef.current = false;
    }
  }, [status, goToAdmin]);

  // Auto-launch the Touch ID prompt the moment the card opens — no extra in-app tap.
  // Deferred a tick (still inside the browser's user-activation window) so the
  // WebAuthn call runs outside the effect body.
  useEffect(() => {
    if (!open) {
      autoStartedRef.current = false;
      return;
    }
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    // Do not clear this tiny handoff timer during React Strict Mode's
    // development-only effect replay. The refs keep it inert after a genuine
    // close or unmount, while ensuring one automatic passkey attempt survives.
    window.setTimeout(() => {
      if (openRef.current && mountedRef.current) {
        void handleFingerprint();
      }
    }, 50);
  }, [open, handleFingerprint]);

  // Match the server's empty portal slot on the first client render. Rendering
  // a portal immediately on /login otherwise creates a hydration mismatch.
  if (!open || !clientReady || typeof document === "undefined") return null;

  // Portal to <body> so the fixed overlay isn't trapped by the header's CSS transform.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Secure login"
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-5"
    >
      <button
        type="button"
        aria-label="Close login"
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <ReflectiveCard
          overlayColor="rgba(0, 0, 0, 0.25)"
          blurStrength={10}
          glassDistortion={15}
          metalness={0.85}
          roughness={0.5}
          displacementStrength={22}
          noiseScale={1.4}
          specularConstant={2.0}
          grayscale={0.55}
          color="#ffffff"
          onFingerprint={handleFingerprint}
          status={status}
          statusMessage={message}
          userRole={status === "success" ? "ACCESS GRANTED" : "TOUCH ID REQUIRED"}
          actionLabel="Authenticate with Touch ID"
        />

        {showPasscode ? (
          <form onSubmit={submitPasscode} className="flex w-full max-w-[21rem] items-center gap-2">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter admin passcode"
              autoFocus
              autoComplete="off"
              className="min-h-11 flex-1 rounded-full border border-white/25 bg-white/10 px-4 text-sm text-white placeholder:text-white/50 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/60"
            />
            <button
              type="submit"
              disabled={status === "authenticating" || passcode.length === 0}
              className="min-h-11 shrink-0 rounded-full bg-white px-5 text-sm font-semibold text-[#07111e] transition hover:bg-white/90 disabled:opacity-50"
            >
              Enter
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={showPasscodeFallback}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70 underline underline-offset-4 transition hover:text-white"
          >
            Use a passcode instead
          </button>
        )}

        <button
          type="button"
          onClick={close}
          className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/85 backdrop-blur transition hover:bg-white/20"
        >
          <LuX size={14} aria-hidden />
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
}
