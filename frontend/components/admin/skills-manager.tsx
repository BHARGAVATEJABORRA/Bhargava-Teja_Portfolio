"use client";

/**
 * Skills editor. Beyond basic CRUD it gives a live "glow chip" preview and an
 * icon picker limited to the icons the public Skills section can actually
 * render — so every skill you add matches the site's grayscale-to-glow style.
 */

import { createElement, useCallback, useEffect, useState } from "react";
import { LuCheck, LuCircleAlert, LuPencil, LuPlus, LuTrash2, LuX } from "react-icons/lu";

import { resolveSkillIcon, SKILL_ICON_KEYS } from "@/lib/skill-icons";

interface SkillForm {
  id?: string;
  category: string;
  name: string;
  iconKey: string;
  brandColor: string;
  keywords: string;
}

const EMPTY: SkillForm = { category: "", name: "", iconKey: "SiReact", brandColor: "#61DAFB", keywords: "" };
type ApiSkill = { id: string; category: string; name: string; iconKey: string; brandColor: string; keywords?: string[] };

function GlowChip({ name, iconKey, brandColor }: { name: string; iconKey: string; brandColor: string }) {
  return (
    <div className="relative inline-flex flex-col items-center gap-2 rounded-[1.6rem] border border-white/10 bg-[#0b1120] px-6 py-5">
      <div
        className="pointer-events-none absolute inset-0 rounded-[1.6rem]"
        style={{ background: `radial-gradient(circle at 50% 0%, ${brandColor}33 0%, transparent 65%)` }}
        aria-hidden
      />
      {createElement(resolveSkillIcon(iconKey), { size: 28, style: { color: brandColor }, "aria-hidden": true })}
      <span className="relative text-sm font-semibold text-white">{name || "Skill name"}</span>
    </div>
  );
}

export function SkillsManager() {
  const [items, setItems] = useState<ApiSkill[]>([]);
  const [form, setForm] = useState<SkillForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/skills", { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as { items: ApiSkill[] };
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

  const set = (patch: Partial<SkillForm>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const save = async () => {
    if (!form) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const isCreate = !form.id;
      const res = await fetch(isCreate ? "/api/admin/skills" : `/api/admin/skills/${form.id}`, {
        method: isCreate ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean) }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? `Save failed (${res.status}).`);
        return;
      }
      setNotice(isCreate ? "Skill added and published." : "Skill updated and published.");
      setForm(null);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this skill?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/skills/${id}`, { method: "DELETE" });
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
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">{form.id ? "Edit skill" : "New skill"}</h2>
          <button type="button" onClick={() => setForm(null)} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-muted-ink)] hover:opacity-80">
            <LuX size={14} aria-hidden /> Cancel
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            className="surface-panel space-y-3 rounded-2xl p-5"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category" required hint="Skills group by this">
                <input className={INPUT} value={form.category} onChange={(e) => set({ category: e.target.value })} placeholder="Cloud / DevOps" />
              </Field>
              <Field label="Skill name" required>
                <input className={INPUT} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Docker" />
              </Field>
              <Field label="Icon" required hint="Only these icons render on the site">
                <select className={INPUT} value={form.iconKey} onChange={(e) => set({ iconKey: e.target.value })}>
                  {SKILL_ICON_KEYS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <Field label="Brand color" required hint="Drives the glow">
                <div className="flex items-center gap-2">
                  <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(form.brandColor) ? form.brandColor : "#61DAFB"} onChange={(e) => set({ brandColor: e.target.value })} className="h-9 w-10 rounded-lg border tint-border-bd-72 bg-transparent" aria-label="Pick color" />
                  <input className={INPUT} value={form.brandColor} onChange={(e) => set({ brandColor: e.target.value })} placeholder="#2496ED" />
                </div>
              </Field>
            </div>
            <Field label="Keywords" hint="Comma-separated (optional, for search)">
              <input className={INPUT} value={form.keywords} onChange={(e) => set({ keywords: e.target.value })} />
            </Field>
            <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 text-sm font-semibold text-black transition hover:opacity-85 disabled:opacity-50">
              <LuCheck size={16} aria-hidden /> {busy ? "Saving…" : form.id ? "Save & publish" : "Add & publish"}
            </button>
          </form>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-ink)]">Live preview</p>
            <div className="flex items-center justify-center rounded-2xl border tint-border-bd-72 bg-[#070b14] p-8">
              <GlowChip name={form.name} iconKey={form.iconKey} brandColor={form.brandColor} />
            </div>
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-muted-ink)]">{loading ? "Loading…" : `${items.length} skill${items.length === 1 ? "" : "s"}`}</p>
        <button type="button" onClick={() => setForm({ ...EMPTY })} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-semibold text-black transition hover:opacity-85">
          <LuPlus size={16} aria-hidden /> New skill
        </button>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((s) => {
          const Icon = resolveSkillIcon(s.iconKey);
          return (
            <li key={s.id} className="surface-panel flex items-center justify-between gap-3 rounded-2xl p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-white/10 bg-[#0b1120]">
                  <span className="pointer-events-none absolute inset-0 rounded-xl" style={{ background: `radial-gradient(circle at 50% 0%, ${s.brandColor}33, transparent 70%)` }} aria-hidden />
                  <Icon size={18} style={{ color: s.brandColor }} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--color-ink)]">{s.name}</p>
                  <p className="truncate text-sm text-[var(--color-muted-ink)]">{s.category}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => setForm({ id: s.id, category: s.category, name: s.name, iconKey: s.iconKey, brandColor: s.brandColor, keywords: (s.keywords ?? []).join(", ") })} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border tint-border-bd-72 tint-card-bg-56 px-3 text-sm font-semibold text-[var(--color-ink)] transition hover:opacity-80">
                  <LuPencil size={14} aria-hidden /> Edit
                </button>
                <button type="button" onClick={() => void remove(s.id)} className="inline-flex min-h-10 items-center rounded-full border border-red-400/30 px-3 text-sm font-semibold text-red-300 transition hover:opacity-80">
                  <LuTrash2 size={14} aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
        {!loading && items.length === 0 && (
          <li className="rounded-2xl border tint-border-bd-72 p-6 text-center text-sm text-[var(--color-muted-ink)] sm:col-span-2">No skills yet — add your first.</li>
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
