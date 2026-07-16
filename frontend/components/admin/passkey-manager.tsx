"use client";

import { useCallback, useEffect, useState } from "react";
import { LuFingerprint, LuShieldCheck, LuTrash2 } from "react-icons/lu";
import { browserSupportsWebAuthn, startRegistration } from "@simplewebauthn/browser";

interface Passkey {
  id: string;
  createdAt: string;
}

async function postJSON(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string })?.error || `Request failed (${res.status})`);
  return data;
}

function shortId(id: string): string {
  return id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

/**
 * Admin control to enroll and manage Touch ID / passkeys. Enrollment only works
 * here because the register endpoints require an authenticated admin session —
 * which is exactly what keeps anyone else from adding their own passkey.
 */
export function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [supported, setSupported] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/passkeys", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { passkeys?: Passkey[] };
      setPasskeys(data.passkeys ?? []);
    } catch {
      setPasskeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
    void load();
  }, [load]);

  const enroll = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    try {
      const optionsJSON = await postJSON("/api/auth/webauthn/register/options");
      const attestation = await startRegistration({ optionsJSON });
      await postJSON("/api/auth/webauthn/register/verify", attestation);
      setMsg({ kind: "ok", text: "Touch ID enabled on this device." });
      await load();
    } catch (err) {
      const name = (err as { name?: string })?.name;
      setMsg({
        kind: "err",
        text: name === "NotAllowedError" ? "Enrollment was cancelled." : (err as Error)?.message || "Enrollment failed.",
      });
    } finally {
      setBusy(false);
    }
  }, [load]);

  const remove = useCallback(
    async (id: string) => {
      if (passkeys.length === 1 && !window.confirm("This is your only passkey. Remove it? You'll sign in with the passcode until you enroll another.")) {
        return;
      }
      setBusy(true);
      setMsg(null);
      try {
        const res = await fetch(`/api/admin/passkeys?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!res.ok) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(d.error ?? `Failed (${res.status}).`);
        }
        await load();
      } catch (err) {
        setMsg({ kind: "err", text: (err as Error).message });
      } finally {
        setBusy(false);
      }
    },
    [passkeys.length, load],
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex items-center gap-2">
        <LuShieldCheck size={18} className="text-teal-400" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">Passkeys &amp; Touch ID</h2>
      </div>
      <p className="mt-1.5 text-xs text-slate-400">
        Enroll this device so you can sign in with Touch ID. Only you can add a passkey — enrollment requires being
        signed in. The passcode always works as a backup.
      </p>

      {msg && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            msg.kind === "ok"
              ? "border border-teal-400/30 bg-teal-500/15 text-teal-200"
              : "border border-red-400/30 bg-red-500/15 text-red-300"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-xs text-slate-400">Loading…</p>
        ) : passkeys.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-400">
            No passkeys enrolled yet. You&apos;re signing in with the passcode.
          </p>
        ) : (
          passkeys.map((pk) => (
            <div
              key={pk.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <LuFingerprint size={16} className="text-amber-400" aria-hidden />
                <div>
                  <p className="font-mono text-xs text-white">{shortId(pk.id)}</p>
                  <p className="text-[10px] text-slate-500">
                    Added {new Date(pk.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void remove(pk.id)}
                disabled={busy}
                aria-label="Remove passkey"
                className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-red-400/30 px-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
              >
                <LuTrash2 size={12} aria-hidden /> Remove
              </button>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => void enroll()}
        disabled={busy || !supported}
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-amber-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
      >
        <LuFingerprint size={15} aria-hidden />
        {busy ? "Working…" : passkeys.length ? "Add another device" : "Enable Touch ID on this device"}
      </button>
      {!supported && (
        <p className="mt-2 text-[11px] text-slate-500">This browser doesn&apos;t support passkeys.</p>
      )}
    </section>
  );
}
