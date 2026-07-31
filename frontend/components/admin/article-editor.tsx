"use client";

/**
 * Blog-aware article editor.
 *
 * Left: a grouped form for the exact fields the public /articles/<slug> blog
 * template renders (title block + premise → body paragraphs → takeaway).
 * Right: a LIVE PREVIEW that mirrors that template so editing → publishing is
 * WYSIWYG. CRUD hits the existing /api/admin/articles endpoints.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { LuCheck, LuCircleAlert, LuExternalLink, LuEye, LuPencil, LuPlus, LuTrash2, LuUpload, LuX } from "react-icons/lu";

import { uploadAdminFile } from "@/lib/admin-upload";

interface ArticleForm {
  id?: string;
  title: string;
  slug: string;
  source: string;
  excerpt: string;
  tagline: string;
  premise: string;
  body: string;
  takeaway: string;
  publishedAt: string;
  readTime: string;
  href: string;
  accent: string;
  ogImage: string;
  tags: string; // comma-separated in the form
  isReal: boolean;
  isExternal: boolean;
}

const EMPTY: ArticleForm = {
  title: "",
  slug: "",
  source: "",
  excerpt: "",
  tagline: "",
  premise: "",
  body: "",
  takeaway: "",
  publishedAt: "",
  readTime: "",
  href: "#",
  accent: "#fcbc1d",
  ogImage: "",
  tags: "",
  isReal: true,
  isExternal: false,
};

type ApiArticle = Partial<ArticleForm> & { id: string; tags?: string[] | string };

function toForm(a: ApiArticle): ArticleForm {
  return {
    ...EMPTY,
    ...a,
    tags: Array.isArray(a.tags) ? a.tags.join(", ") : typeof a.tags === "string" ? a.tags : "",
    isReal: a.isReal !== false,
    isExternal: a.isExternal === true,
  };
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function ArticleEditor() {
  const [items, setItems] = useState<ApiArticle[]>([]);
  const [form, setForm] = useState<ArticleForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ogUploading, setOgUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/articles", { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as { items: ApiArticle[] };
      setItems(data.items ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const set = (patch: Partial<ArticleForm>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const uploadOg = async (file: File) => {
    setOgUploading(true);
    setError(null);
    try {
      const url = await uploadAdminFile(file, "media", "Article OG image");
      set({ ogImage: url });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOgUploading(false);
    }
  };

  const save = async () => {
    if (!form) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    try {
      const isCreate = !form.id;
      const res = await fetch(isCreate ? "/api/admin/articles" : `/api/admin/articles/${form.id}`, {
        method: isCreate ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? `Save failed (${res.status}).`);
        return;
      }
      setNotice(isCreate ? "Article published." : "Article updated and published.");
      setForm(null);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this article? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error ?? "Delete failed.");
        return;
      }
      if (form?.id === id) setForm(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  if (form) {
    return (
      <div className="space-y-4">
        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm font-semibold text-red-300">
            <LuCircleAlert size={16} aria-hidden /> {error}
          </div>
        )}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">{form.id ? "Edit article" : "New article"}</h2>
          <button type="button" onClick={() => setForm(null)} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-muted-ink)] hover:opacity-80">
            <LuX size={14} aria-hidden /> Cancel
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Editor form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            className="surface-panel space-y-3 rounded-2xl p-5"
          >
            <Field label="Title" required>
              <input className={INPUT} value={form.title} onChange={(e) => set({ title: e.target.value, slug: form.slug || slugify(e.target.value) })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Slug" required hint="/articles/<slug>">
                <input className={INPUT} value={form.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} />
              </Field>
              <Field label="Kicker / source">
                <input className={INPUT} value={form.source} onChange={(e) => set({ source: e.target.value })} placeholder="Cloud Cost · FinOps" />
              </Field>
            </div>
            <Field label="Excerpt (card + meta description)" required>
              <textarea className={INPUT} rows={2} value={form.excerpt} onChange={(e) => set({ excerpt: e.target.value })} />
            </Field>
            <Field label="Tagline (pull quote)">
              <input className={INPUT} value={form.tagline} onChange={(e) => set({ tagline: e.target.value })} />
            </Field>
            <Field label="Premise (bold intro paragraph)" required>
              <textarea className={INPUT} rows={2} value={form.premise} onChange={(e) => set({ premise: e.target.value })} />
            </Field>
            <Field label="Body" hint="Separate paragraphs with a blank line — each becomes its own paragraph in the post.">
              <textarea className={`${INPUT} font-mono`} rows={10} value={form.body} onChange={(e) => set({ body: e.target.value })} />
            </Field>
            <Field label="Takeaway (highlighted callout)" required>
              <textarea className={INPUT} rows={2} value={form.takeaway} onChange={(e) => set({ takeaway: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Published" required>
                <input className={INPUT} value={form.publishedAt} onChange={(e) => set({ publishedAt: e.target.value })} placeholder="March 2025" />
              </Field>
              <Field label="Read time" required>
                <input className={INPUT} value={form.readTime} onChange={(e) => set({ readTime: e.target.value })} placeholder="8 min read" />
              </Field>
              <Field label="Tags" hint="Comma-separated">
                <input className={INPUT} value={form.tags} onChange={(e) => set({ tags: e.target.value })} />
              </Field>
              <Field label="Accent color">
                <input className={INPUT} value={form.accent} onChange={(e) => set({ accent: e.target.value })} placeholder="#fcbc1d" />
              </Field>
              <Field label="External URL (optional)">
                <input className={INPUT} value={form.href} onChange={(e) => set({ href: e.target.value })} placeholder="# or https://…" />
              </Field>
            </div>
            <Field label="Social share image (OG)" hint="Recommended 1200×630. Falls back to the site OG image when empty.">
              <div className="flex flex-wrap items-center gap-2">
                <input className={`${INPUT} flex-1`} value={form.ogImage} onChange={(e) => set({ ogImage: e.target.value })} placeholder="/uploads/…" />
                <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-semibold text-black transition hover:opacity-85">
                  <LuUpload size={14} aria-hidden />
                  {ogUploading ? "Uploading…" : "Upload"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={ogUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadOg(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </Field>
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                <input type="checkbox" checked={form.isReal} onChange={(e) => set({ isReal: e.target.checked })} /> Real published post
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                <input type="checkbox" checked={form.isExternal} onChange={(e) => set({ isExternal: e.target.checked })} /> Links out externally
              </label>
            </div>
            <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 text-sm font-semibold text-black transition hover:opacity-85 disabled:opacity-50">
              <LuCheck size={16} aria-hidden /> {busy ? "Publishing…" : form.id ? "Save & publish" : "Create & publish"}
            </button>
          </form>

          {/* Live preview */}
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-ink)]">
              <LuEye size={13} aria-hidden /> Live preview — matches the public post
            </p>
            <ArticlePreview form={form} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-300">
          <LuCheck size={16} aria-hidden /> {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm font-semibold text-red-300">
          <LuCircleAlert size={16} aria-hidden /> {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-muted-ink)]">{loading ? "Loading…" : `${items.length} article${items.length === 1 ? "" : "s"}`}</p>
        <button type="button" onClick={() => setForm({ ...EMPTY })} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-semibold text-black transition hover:opacity-85">
          <LuPlus size={16} aria-hidden /> New article
        </button>
      </div>
      <ul className="space-y-3">
        {items.map((a) => (
          <li key={a.id} className="surface-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <div className="min-w-0">
              <p className="truncate font-semibold text-[var(--color-ink)]">
                {a.title}
                {a.isReal === false && <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-ink)]">sample</span>}
              </p>
              <p className="truncate text-sm text-[var(--color-muted-ink)]">{a.publishedAt} · {a.readTime} · /{a.slug}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a href={`/articles/${a.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border tint-border-bd-72 tint-card-bg-56 px-3 text-sm font-semibold text-[var(--color-ink)] transition hover:opacity-80">
                <LuExternalLink size={14} aria-hidden /> View
              </a>
              <button type="button" onClick={() => setForm(toForm(a))} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border tint-border-bd-72 tint-card-bg-56 px-3 text-sm font-semibold text-[var(--color-ink)] transition hover:opacity-80">
                <LuPencil size={14} aria-hidden /> Edit
              </button>
              <button type="button" onClick={() => void remove(a.id)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-red-400/30 px-3 text-sm font-semibold text-red-300 transition hover:opacity-80">
                <LuTrash2 size={14} aria-hidden />
              </button>
            </div>
          </li>
        ))}
        {!loading && items.length === 0 && (
          <li className="rounded-2xl border tint-border-bd-72 p-6 text-center text-sm text-[var(--color-muted-ink)]">No articles yet — write your first post.</li>
        )}
      </ul>
    </div>
  );
}

const INPUT =
  "w-full rounded-xl border tint-border-bd-72 tint-card-bg-56 px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]";

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted-ink)]">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
      {hint && <span className="block text-xs text-[var(--color-muted-ink)]">{hint}</span>}
    </label>
  );
}

/** Mirrors app/articles/[slug]/page.tsx so the editor is WYSIWYG. */
function ArticlePreview({ form }: { form: ArticleForm }) {
  const accent = form.accent || "#fcbc1d";
  const paragraphs = useMemo(() => (form.body || form.excerpt).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean), [form.body, form.excerpt]);
  const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="overflow-hidden rounded-2xl border tint-border-bd-72" style={{ background: "linear-gradient(160deg, #0a1628 0%, #0d1f3c 48%, #060f1c 100%)" }}>
      <div className="max-h-[70vh] overflow-y-auto px-5 py-6 text-white">
        <div className="rounded-2xl border p-5" style={{ borderColor: `${accent}40`, background: `${accent}0d` }}>
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: `${accent}cc` }}>
            <span>ART-PREVIEW</span>
            <span className="truncate pl-3 text-white/55">{form.source || "Article"}</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold leading-tight">{form.title || "Untitled article"}</h1>
          {form.tagline && (
            <p className="mt-3 border-l-2 pl-4 text-base italic text-white/75" style={{ borderColor: `${accent}80` }}>&quot;{form.tagline}&quot;</p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
            {form.publishedAt && <span>{form.publishedAt}</span>}
            {form.readTime && <span>{form.readTime}</span>}
          </div>
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="rounded border px-2.5 py-0.5 font-mono text-[11px]" style={{ borderColor: `${accent}33`, backgroundColor: `${accent}12`, color: `${accent}dd` }}>{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 space-y-5 text-[0.98rem] leading-[1.8] text-white/80">
          {form.premise && <p className="text-lg font-medium text-white/90">{form.premise}</p>}
          {paragraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          {form.takeaway && (
            <div className="mt-6 rounded-xl border-l-4 p-5" style={{ borderColor: accent, background: `${accent}10` }}>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: `${accent}cc` }}>↳ Takeaway</p>
              <p className="mt-2 text-white/85">{form.takeaway}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
