"use client";

import { useEffect, useState } from "react";
import { LuMessagesSquare, LuUser, LuBot } from "react-icons/lu";

import { AdminShell } from "@/components/admin/admin-shell";

interface AiRow {
  id: string;
  question: string;
  answer: string;
  mode: string | null;
  createdAt: number;
}

function when(ms: number): string {
  return new Date(ms).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function AdminAiChatsPage() {
  const [items, setItems] = useState<AiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/ai-conversations", { cache: "no-store" });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = (await res.json()) as { items: AiRow[] };
        if (!cancelled) setItems(data.items ?? []);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminShell title="AI companion chats" description="What visitors are asking your AI companion, and how it answered. Stored on your own database.">
      {error && <p className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-300">{error}</p>}
      {!error && !loading && items.length === 0 && (
        <p className="rounded-2xl border tint-border-bd-72 p-8 text-center text-sm text-[var(--color-muted-ink)]">
          No AI conversations yet. When visitors chat with your companion, the transcript appears here.
        </p>
      )}
      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.id} className="surface-panel space-y-2 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
                <LuUser size={14} className="text-teal-400" aria-hidden /> {c.question}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-[var(--color-muted-ink)]">{when(c.createdAt)}</span>
            </div>
            <p className="flex gap-2 rounded-xl border tint-border-bd-72 tint-card-bg-56 p-3 text-sm text-[var(--color-muted-ink)]">
              <LuBot size={15} className="mt-0.5 shrink-0 text-purple-400" aria-hidden />
              <span className="whitespace-pre-wrap">{c.answer}</span>
            </p>
            {c.mode && (
              <span className="inline-flex items-center gap-1 rounded-full border tint-border-bd-72 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-ink)]">
                <LuMessagesSquare size={10} aria-hidden /> {c.mode}
              </span>
            )}
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
