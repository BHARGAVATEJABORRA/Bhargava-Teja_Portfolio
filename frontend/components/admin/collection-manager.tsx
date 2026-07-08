"use client";

/**
 * Config-driven CRUD manager for the admin content collections.
 *
 * Each collection page describes its fields once (FieldSpec[]); this component
 * renders the list, create/edit form, and delete flow against the matching
 * /api/admin/<collection> endpoints, with success/error banners.
 */

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuCheck, LuCircleAlert, LuImage, LuPencil, LuPlus, LuTrash2, LuUpload, LuX } from "react-icons/lu";

export type FieldKind = "text" | "textarea" | "select" | "checkbox" | "number" | "csv" | "lines" | "metrics" | "image";

export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  /** Render half-width on wider screens. */
  half?: boolean;
}

export interface CollectionManagerProps<TDto extends { id: string }> {
  endpoint: string; // e.g. "/api/admin/projects"
  entityLabel: string; // e.g. "project"
  fields: FieldSpec[];
  itemTitle: (dto: TDto) => string;
  itemSubtitle?: (dto: TDto) => string;
  /** Optional badge rendered before the title on each list row (e.g. the experience kind). */
  itemBadge?: (dto: TDto) => ReactNode;
  /** Optional list ordering applied after fetch (e.g. work → education → certifications). */
  sortItems?: (items: TDto[]) => TDto[];
}

type FormState = Record<string, string | boolean>;
type Dto = Record<string, unknown> & { id: string };

const inputClass =
  "w-full rounded-xl border tint-border-bd-72 tint-card-bg-56 px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]";

function metricsToText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .filter((m): m is { value: string; label: string } => !!m && typeof m === "object")
    .map((m) => `${m.value} | ${m.label}`)
    .join("\n");
}

function textToMetrics(text: string): { value: string; label: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, ...rest] = line.split("|");
      return { value: (value ?? "").trim(), label: rest.join("|").trim() };
    })
    .filter((m) => m.value && m.label);
}

function dtoToForm(fields: FieldSpec[], dto: Dto | null): FormState {
  const form: FormState = {};
  for (const field of fields) {
    const raw = dto?.[field.key];
    switch (field.kind) {
      case "checkbox":
        form[field.key] = raw === true;
        break;
      case "csv":
        form[field.key] = Array.isArray(raw) ? (raw as string[]).join(", ") : "";
        break;
      case "lines":
        form[field.key] = Array.isArray(raw) ? (raw as string[]).join("\n") : "";
        break;
      case "metrics":
        form[field.key] = metricsToText(raw);
        break;
      case "number":
        form[field.key] = typeof raw === "number" ? String(raw) : "";
        break;
      default:
        form[field.key] = typeof raw === "string" ? raw : "";
    }
  }
  return form;
}

function formToPayload(fields: FieldSpec[], form: FormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = form[field.key];
    switch (field.kind) {
      case "checkbox":
        payload[field.key] = raw === true;
        break;
      case "csv":
        payload[field.key] = String(raw ?? "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
        break;
      case "lines":
        payload[field.key] = String(raw ?? "")
          .split("\n")
          .map((v) => v.trim())
          .filter(Boolean);
        break;
      case "metrics":
        payload[field.key] = textToMetrics(String(raw ?? ""));
        break;
      case "number": {
        const num = Number(String(raw ?? "").trim());
        payload[field.key] = Number.isFinite(num) && String(raw ?? "").trim() !== "" ? num : undefined;
        break;
      }
      default:
        payload[field.key] = String(raw ?? "").trim();
    }
  }
  return payload;
}

export function CollectionManager<TDto extends { id: string }>({
  endpoint,
  entityLabel,
  fields,
  itemTitle,
  itemSubtitle,
  itemBadge,
  sortItems,
}: CollectionManagerProps<TDto>) {
  const [items, setItems] = useState<Dto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // null = closed, "new" = create
  const [form, setForm] = useState<FormState>({});
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validation errors auto-dismiss after 5s (or on the next form edit below).
  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 5000);
  }, []);

  useEffect(() => () => {
    if (errorTimer.current) clearTimeout(errorTimer.current);
  }, []);

  const editField = useCallback((key: string, value: string | boolean) => {
    setError(null); // dismiss the error banner on the next edit
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const emptyForm = useMemo(() => dtoToForm(fields, null), [fields]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (res.status === 401) {
        showError("Session expired — sign in again from the login page.");
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as { items: Dto[] };
      setItems(sortItems ? (sortItems(data.items as unknown as TDto[]) as unknown as Dto[]) : data.items);
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, showError, sortItems]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId("new");
    setNotice(null);
    setError(null);
  };

  const openEdit = (dto: Dto) => {
    setForm(dtoToForm(fields, dto));
    setEditingId(dto.id);
    setNotice(null);
    setError(null);
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const isCreate = editingId === "new";
      const res = await fetch(isCreate ? endpoint : `${endpoint}/${editingId}`, {
        method: isCreate ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(fields, form)),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showError(data.error ?? `Save failed (${res.status}).`);
        return;
      }
      setNotice(isCreate ? `New ${entityLabel} created and published.` : `${capitalize(entityLabel)} updated and published.`);
      setEditingId(null);
      await refresh();
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (dto: Dto) => {
    if (!window.confirm(`Delete this ${entityLabel}? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`${endpoint}/${dto.id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showError(data.error ?? `Delete failed (${res.status}).`);
        return;
      }
      setNotice(`${capitalize(entityLabel)} deleted and unpublished.`);
      if (editingId === dto.id) setEditingId(null);
      await refresh();
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const errorBanner = error && (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm font-semibold text-red-300"
    >
      <LuCircleAlert size={16} aria-hidden />
      <span>{error}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Outside the form: success notices + errors when no form is open. */}
      {(editingId === null && error) || notice ? (
        editingId === null && error ? (
          errorBanner
        ) : (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-[rgba(120,220,160,0.4)] bg-[rgba(70,200,130,0.12)] px-4 py-3 text-sm font-medium text-[#9be8bd]"
          >
            <LuCheck size={16} aria-hidden />
            <span>{notice}</span>
          </div>
        )
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted-ink)]">
          {loading ? "Loading…" : `${items.length} ${entityLabel}${items.length === 1 ? "" : "s"}`}
        </p>
        <button
          type="button"
          onClick={openCreate}
          disabled={busy}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-semibold text-black transition hover:opacity-85 disabled:opacity-50"
        >
          <LuPlus size={16} aria-hidden />
          New {entityLabel}
        </button>
      </div>

      {editingId !== null && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="surface-panel space-y-4 rounded-2xl p-5"
        >
          {/* Prominent API validation errors at the top of the form (4xx responses). */}
          {errorBanner}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">
              {editingId === "new" ? `New ${entityLabel}` : `Edit ${entityLabel}`}
            </h2>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-muted-ink)] hover:opacity-80"
            >
              <LuX size={14} aria-hidden /> Cancel
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const value = form[field.key];
              const wrapClass = field.half ? "" : "sm:col-span-2";
              if (field.kind === "checkbox") {
                return (
                  <label key={field.key} className={`flex items-center gap-2 text-sm text-[var(--color-ink)] ${wrapClass}`}>
                    <input
                      type="checkbox"
                      checked={value === true}
                      onChange={(e) => editField(field.key, e.target.checked)}
                    />
                    {field.label}
                  </label>
                );
              }
              if (field.kind === "image") {
                return (
                  <ImageUploadField
                    key={field.key}
                    field={field}
                    value={String(value ?? "")}
                    wrapClass={wrapClass}
                    onChange={(url) => editField(field.key, url)}
                    onError={showError}
                  />
                );
              }
              return (
                <label key={field.key} className={`block space-y-1 ${wrapClass}`}>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted-ink)]">
                    {field.label}
                    {field.required ? " *" : ""}
                  </span>
                  {field.kind === "textarea" || field.kind === "lines" || field.kind === "metrics" ? (
                    <textarea
                      value={String(value ?? "")}
                      onChange={(e) => editField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={field.kind === "textarea" ? 3 : 4}
                      className={inputClass}
                    />
                  ) : field.kind === "select" ? (
                    <select
                      value={String(value ?? "")}
                      onChange={(e) => editField(field.key, e.target.value)}
                      className={inputClass}
                    >
                      {(field.options ?? []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={String(value ?? "")}
                      onChange={(e) => editField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  )}
                  {field.hint && <span className="block text-xs text-[var(--color-muted-ink)]">{field.hint}</span>}
                </label>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 text-sm font-semibold text-black transition hover:opacity-85 disabled:opacity-50"
          >
            <LuCheck size={16} aria-hidden />
            {busy ? "Saving…" : editingId === "new" ? `Create ${entityLabel}` : "Save changes"}
          </button>
        </form>
      )}

      <ul className="space-y-3">
        {items.map((dto) => (
          <li key={dto.id} className="surface-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate font-semibold text-[var(--color-ink)]">
                {itemBadge?.(dto as unknown as TDto)}
                <span className="truncate">{itemTitle(dto as unknown as TDto)}</span>
              </p>
              {itemSubtitle && (
                <p className="truncate text-sm text-[var(--color-muted-ink)]">{itemSubtitle(dto as unknown as TDto)}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => openEdit(dto)}
                disabled={busy}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border tint-border-bd-72 tint-card-bg-56 px-4 text-sm font-semibold text-[var(--color-ink)] transition hover:opacity-80 disabled:opacity-50"
              >
                <LuPencil size={14} aria-hidden /> Edit
              </button>
              <button
                type="button"
                onClick={() => void remove(dto)}
                disabled={busy}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[rgba(255,120,120,0.35)] bg-[rgba(255,90,90,0.08)] px-4 text-sm font-semibold text-[#ffb4b4] transition hover:opacity-80 disabled:opacity-50"
              >
                <LuTrash2 size={14} aria-hidden /> Delete
              </button>
            </div>
          </li>
        ))}
        {!loading && items.length === 0 && (
          <li className="rounded-2xl border tint-border-bd-72 p-6 text-center text-sm text-[var(--color-muted-ink)]">
            Nothing here yet — create your first {entityLabel}.
          </li>
        )}
      </ul>
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** URL text + upload button + thumbnail preview, posting to /api/admin/upload. */
function ImageUploadField({
  field,
  value,
  wrapClass,
  onChange,
  onError,
}: {
  field: FieldSpec;
  value: string;
  wrapClass: string;
  onChange: (url: string) => void;
  onError: (msg: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", "image");
      body.append("label", field.label);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? `Upload failed (${res.status}).`);
      onChange(data.url);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`block space-y-2 ${wrapClass}`}>
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted-ink)]">{field.label}</span>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex h-16 w-24 flex-none items-center justify-center overflow-hidden rounded-lg border tint-border-bd-72 tint-card-bg-56">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of uploaded asset
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <LuImage size={20} className="text-[var(--color-muted-ink)]" aria-hidden />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? "/uploads/…"}
            className={inputClass}
          />
          <div className="flex items-center gap-2">
            <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-semibold text-black transition hover:opacity-85">
              <LuUpload size={14} aria-hidden />
              {uploading ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                  e.target.value = "";
                }}
              />
            </label>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex min-h-9 items-center rounded-full border tint-border-bd-72 tint-card-bg-56 px-3 text-sm font-semibold text-[var(--color-muted-ink)] transition hover:opacity-80"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
      {field.hint && <span className="block text-xs text-[var(--color-muted-ink)]">{field.hint}</span>}
    </div>
  );
}
