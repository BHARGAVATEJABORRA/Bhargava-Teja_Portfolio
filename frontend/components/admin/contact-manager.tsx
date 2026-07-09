"use client";

import { useCallback, useEffect, useState } from "react";
import { LuMail, LuMailOpen, LuReply, LuTrash2, LuTriangleAlert, LuTag } from "react-icons/lu";

interface ContactRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string | null;
  message: string;
  status: string;
  tag: string | null;
  createdAt: number;
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "new", label: "Unread" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "spam", label: "Spam" },
] as const;

const TAGS = ["freelance", "fulltime", "collab", "spam"];

const STATUS_STYLE: Record<string, string> = {
  new: "border-amber-400/40 bg-amber-400/15 text-amber-300",
  read: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  replied: "border-emerald-400/40 bg-emerald-400/15 text-emerald-300",
  spam: "border-red-400/40 bg-red-400/15 text-red-300",
};

function when(ms: number): string {
  return new Date(ms).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function ContactManager() {
  const [items, setItems] = useState<ContactRow[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/contacts?status=${filter}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as { items: ContactRow[] };
      setItems(data.items ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (id: string, body: { status?: string; tag?: string | null }) => {
    setItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...body, tag: body.tag !== undefined ? body.tag : r.tag } : r)));
    await fetch(`/api/admin/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => void load());
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this message? This cannot be undone.")) return;
    setItems((rows) => rows.filter((r) => r.id !== id));
    await fetch(`/api/admin/contacts/${id}`, { method: "DELETE" }).catch(() => void load());
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold transition ${
              filter === f.value
                ? "bg-[var(--color-accent)] text-black"
                : "border tint-border-bd-72 tint-card-bg-56 text-[var(--color-ink)] hover:opacity-80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-300">{error}</p>}
      {!error && !loading && items.length === 0 && (
        <p className="rounded-2xl border tint-border-bd-72 p-8 text-center text-sm text-[var(--color-muted-ink)]">
          No messages here yet. Submissions from your contact form will land in this inbox.
        </p>
      )}

      <ul className="space-y-3">
        {items.map((m) => (
          <li key={m.id} className="surface-panel space-y-3 rounded-2xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-[var(--color-ink)]">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${STATUS_STYLE[m.status] ?? STATUS_STYLE.read}`}>
                    {m.status}
                  </span>
                  <span className="truncate">{m.name}</span>
                  {m.tag && (
                    <span className="inline-flex items-center gap-1 rounded-full border tint-border-bd-72 px-2 py-0.5 text-[10px] text-[var(--color-muted-ink)]">
                      <LuTag size={10} aria-hidden /> {m.tag}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-[var(--color-muted-ink)]">
                  <a href={`mailto:${m.email}`} className="underline underline-offset-2 hover:opacity-80">{m.email}</a>
                  {m.phone ? ` · ${m.phone}` : ""} · {m.topic || "Contact"} · {when(m.createdAt)}
                </p>
              </div>
            </div>

            <p className="whitespace-pre-wrap rounded-xl border tint-border-bd-72 tint-card-bg-56 p-3 text-sm text-[var(--color-ink)]">{m.message}</p>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`mailto:${m.email}?subject=Re:%20${encodeURIComponent(m.topic || "Your message")}`}
                onClick={() => void patch(m.id, { status: "replied" })}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3 text-sm font-semibold text-black transition hover:opacity-85"
              >
                <LuReply size={14} aria-hidden /> Reply
              </a>
              <button type="button" onClick={() => void patch(m.id, { status: m.status === "new" ? "read" : "new" })} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border tint-border-bd-72 tint-card-bg-56 px-3 text-sm font-semibold text-[var(--color-ink)] transition hover:opacity-80">
                {m.status === "new" ? <LuMailOpen size={14} aria-hidden /> : <LuMail size={14} aria-hidden />}
                {m.status === "new" ? "Mark read" : "Mark unread"}
              </button>
              <button type="button" onClick={() => void patch(m.id, { status: "spam" })} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-3 text-sm font-semibold text-red-300 transition hover:opacity-80">
                <LuTriangleAlert size={14} aria-hidden /> Spam
              </button>
              <select
                value={m.tag ?? ""}
                onChange={(e) => void patch(m.id, { tag: e.target.value || null })}
                className="min-h-9 rounded-full border tint-border-bd-72 tint-card-bg-56 px-3 text-sm text-[var(--color-ink)]"
                aria-label="Tag"
              >
                <option value="">No tag</option>
                {TAGS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button type="button" onClick={() => void remove(m.id)} className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-full border border-red-400/30 px-3 text-sm font-semibold text-red-300 transition hover:opacity-80">
                <LuTrash2 size={14} aria-hidden /> Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
