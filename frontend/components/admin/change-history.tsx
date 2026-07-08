"use client";

import { useCallback, useEffect, useState } from "react";
import { LuHistory, LuPlus, LuPencil, LuTrash2, LuUpload, LuRefreshCw } from "react-icons/lu";

export interface ChangeLogItem {
  id: string;
  entity: string;
  entityId: string | null;
  action: string;
  summary: string;
  field: string | null;
  snapshot: string | null;
  createdAt: number;
}

const ACTION_META: Record<string, { icon: typeof LuPlus; className: string; label: string }> = {
  create: { icon: LuPlus, className: "text-teal-400", label: "Added" },
  update: { icon: LuPencil, className: "text-amber-400", label: "Updated" },
  delete: { icon: LuTrash2, className: "text-red-400", label: "Deleted" },
  upload: { icon: LuUpload, className: "text-blue-400", label: "Uploaded" },
  publish: { icon: LuRefreshCw, className: "text-purple-400", label: "Published" },
};

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

/**
 * Admin activity log. Embed anywhere with an optional `entity` to scope to one
 * section (e.g. <ChangeHistory entity="project" />), or omit for the full feed.
 */
export function ChangeHistory({
  entity,
  limit = 50,
  title = "Change history",
  compact = false,
}: {
  entity?: string;
  limit?: number;
  title?: string;
  compact?: boolean;
}) {
  const [items, setItems] = useState<ChangeLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (entity) qs.set("entity", entity);
      qs.set("limit", String(limit));
      const res = await fetch(`/api/admin/history?${qs.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items: ChangeLogItem[] };
      setItems(data.items ?? []);
    } catch {
      setError("Couldn't load change history.");
    } finally {
      setLoading(false);
    }
  }, [entity, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LuHistory size={16} className="text-amber-400" aria-hidden />
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">{title}</h3>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-300 transition hover:text-white"
        >
          <LuRefreshCw size={12} aria-hidden className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {error && <p className="text-sm text-red-300">{error}</p>}
      {!error && !loading && items.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400">No changes recorded yet. Edits you make will appear here.</p>
      )}

      <ol className="relative space-y-0">
        {items.map((item, i) => {
          const meta = ACTION_META[item.action] ?? ACTION_META.update;
          const Icon = meta.icon;
          return (
            <li key={item.id} className="relative flex gap-3 pb-4">
              {i < items.length - 1 && <span aria-hidden className="absolute left-[11px] top-6 h-full w-px bg-white/10" />}
              <span
                className={`relative z-10 mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-white/10 bg-black/40 ${meta.className}`}
              >
                <Icon size={12} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white">{item.summary}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] text-slate-500">
                  <span className="uppercase tracking-[0.12em] text-slate-400">{item.entity}</span>
                  {!compact && item.field && <span>· {item.field}</span>}
                  <span>· {timeAgo(item.createdAt)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
