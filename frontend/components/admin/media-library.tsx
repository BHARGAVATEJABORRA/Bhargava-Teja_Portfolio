"use client";

import { useCallback, useEffect, useState } from "react";
import { LuCopy, LuCheck, LuTrash2, LuUpload, LuFile } from "react-icons/lu";

interface MediaItem {
  name: string;
  url: string;
  size: number;
  modified: number;
  isImage: boolean;
}

function human(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/media", { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as { items: MediaItem[] };
      setItems(data.items ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (files: FileList) => {
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        body.append("kind", "media");
        body.append("label", file.name);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        if (!res.ok) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(d.error ?? `Upload failed (${res.status}).`);
        }
      }
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied((c) => (c === url ? null : c)), 1500);
    } catch {
      /* ignore */
    }
  };

  const remove = async (name: string) => {
    if (!window.confirm(`Delete "${name}"? References to it will break.`)) return;
    setItems((rows) => rows.filter((r) => r.name !== name));
    await fetch(`/api/admin/media?file=${encodeURIComponent(name)}`, { method: "DELETE" }).catch(() => void load());
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted-ink)]">{loading ? "Loading…" : `${items.length} file${items.length === 1 ? "" : "s"}`}</p>
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-semibold text-black transition hover:opacity-85">
          <LuUpload size={15} aria-hidden />
          {uploading ? "Uploading…" : "Upload files"}
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              if (e.target.files?.length) void upload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {error && <p className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-300">{error}</p>}
      {!error && !loading && items.length === 0 && (
        <p className="rounded-2xl border tint-border-bd-72 p-8 text-center text-sm text-[var(--color-muted-ink)]">
          No media yet. Upload screenshots and assets here, then reference their URLs when adding projects.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((m) => (
          <div key={m.name} className="surface-panel overflow-hidden rounded-2xl">
            <div className="flex aspect-video items-center justify-center overflow-hidden border-b tint-border-bd-72 bg-black/20">
              {m.isImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin media preview
                <img src={m.url} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <LuFile size={28} className="text-[var(--color-muted-ink)]" aria-hidden />
              )}
            </div>
            <div className="space-y-2 p-3">
              <p className="truncate text-xs font-semibold text-[var(--color-ink)]" title={m.name}>{m.name}</p>
              <p className="font-mono text-[10px] text-[var(--color-muted-ink)]">{human(m.size)}</p>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => void copy(m.url)} className="inline-flex min-h-8 flex-1 items-center justify-center gap-1 rounded-lg border tint-border-bd-72 tint-card-bg-56 text-xs font-semibold text-[var(--color-ink)] transition hover:opacity-80">
                  {copied === m.url ? <LuCheck size={12} aria-hidden /> : <LuCopy size={12} aria-hidden />}
                  {copied === m.url ? "Copied" : "Copy URL"}
                </button>
                <button type="button" onClick={() => void remove(m.name)} aria-label={`Delete ${m.name}`} className="inline-flex min-h-8 items-center justify-center rounded-lg border border-red-400/30 px-2 text-red-300 transition hover:opacity-80">
                  <LuTrash2 size={12} aria-hidden />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
