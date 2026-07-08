"use client";

/**
 * /admin/settings — site-wide configuration editor.
 *
 * Six collapsible section cards (Identity & Hero, Social & Links, AI
 * Companion, Spotify Widget, Site Metadata, Contact), each with its own Save
 * button and success/error banner. Values load from GET /api/admin/config and
 * save via PATCH { values: { … } }.
 *
 * Secrets arrive masked ("••••abcd"); the API ignores masked placeholders on
 * save, so re-saving a section never overwrites a stored secret.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  LuActivity,
  LuBot,
  LuCheck,
  LuChevronDown,
  LuCircleAlert,
  LuGlobe,
  LuLink,
  LuMail,
  LuMusic,
  LuToggleRight,
  LuUpload,
  LuUser,
} from "react-icons/lu";

import type { SiteConfigKey, SiteConfigStat } from "@/lib/site-config";

type ConfigValue = string | boolean | string[] | SiteConfigStat[] | { label: string; url: string };
type ConfigState = Record<string, ConfigValue>;

interface FieldDef {
  key: SiteConfigKey;
  label: string;
  type: "text" | "textarea" | "secret" | "toggle" | "select" | "csv" | "stats" | "customLink" | "file";
  options?: { value: string; label: string }[];
  hint?: string;
  placeholder?: string;
  half?: boolean;
  accept?: string;
  uploadKind?: "resume" | "image" | "media";
}

interface SectionDef {
  id: string;
  title: string;
  icon: typeof LuUser;
  accent: string;
  fields: FieldDef[];
}

const SECTIONS: SectionDef[] = [
  {
    id: "identity",
    title: "A · Identity & Hero",
    icon: LuUser,
    accent: "text-amber-400",
    fields: [
      { key: "fullName", label: "Full name", type: "text", half: true, hint: "Shown in hero, nav, and footer" },
      { key: "roleLine", label: "Job title / role line", type: "text", half: true },
      { key: "location", label: "Location", type: "text", half: true, placeholder: "Addison (Dallas), TX, USA" },
      { key: "currentEmployer", label: "Current employer", type: "text", half: true, hint: "The “Currently at X” badge in About" },
      { key: "heroTagline", label: "Hero tagline", type: "textarea", hint: "The typed subtitle in the hero" },
      { key: "aboutBio", label: "About bio paragraph", type: "textarea" },
      { key: "aboutSpecialties", label: "About specialty tags", type: "csv", hint: "Comma-separated chips, e.g. AWS Platform Engineering, Infrastructure as Code" },
      { key: "aboutStats", label: "About stats (3)", type: "stats" },
    ],
  },
  {
    id: "social",
    title: "B · Social & Links",
    icon: LuLink,
    accent: "text-teal-400",
    fields: [
      { key: "email", label: "Email address", type: "text", half: true },
      { key: "githubUrl", label: "GitHub URL", type: "text", half: true },
      { key: "linkedinUrl", label: "LinkedIn URL", type: "text", half: true },
      {
        key: "resumeUrl",
        label: "Resume / CV (PDF)",
        type: "file",
        accept: "application/pdf",
        uploadKind: "resume",
        hint: "Upload a PDF to replace the downloadable resume, or paste a URL. Saving is automatic on upload.",
      },
      { key: "twitterUrl", label: "Twitter / X URL (optional)", type: "text", half: true },
      { key: "customLink", label: "Custom link", type: "customLink" },
    ],
  },
  {
    id: "ai",
    title: "C · AI Companion",
    icon: LuBot,
    accent: "text-purple-400",
    fields: [
      { key: "aiEnabled", label: "AI companion enabled", type: "toggle" },
      { key: "openaiApiKey", label: "OpenAI API key", type: "secret", half: true },
      {
        key: "openaiModel",
        label: "OpenAI model",
        type: "select",
        half: true,
        options: [
          { value: "gpt-4o", label: "gpt-4o" },
          { value: "gpt-4o-mini", label: "gpt-4o-mini" },
          { value: "gpt-4-turbo", label: "gpt-4-turbo" },
        ],
      },
      { key: "aiSystemPrompt", label: "System prompt", type: "textarea" },
    ],
  },
  {
    id: "spotify",
    title: "D · Spotify Widget",
    icon: LuMusic,
    accent: "text-emerald-400",
    fields: [
      { key: "spotifyEnabled", label: "Spotify widget enabled", type: "toggle" },
      { key: "spotifyClientId", label: "Spotify Client ID", type: "secret", half: true },
      { key: "spotifyClientSecret", label: "Spotify Client Secret", type: "secret", half: true },
      { key: "spotifyRefreshToken", label: "Spotify Refresh Token", type: "secret" },
    ],
  },
  {
    id: "meta",
    title: "E · Site Metadata",
    icon: LuGlobe,
    accent: "text-blue-400",
    fields: [
      { key: "titleTemplate", label: "Page title template", type: "text", hint: "Shown in browser tabs and search results" },
      { key: "metaDescription", label: "Meta description", type: "textarea", hint: "~150–160 chars; the search-result snippet" },
      {
        key: "ogImageUrl",
        label: "Social share image (OG)",
        type: "file",
        accept: "image/png,image/jpeg,image/webp",
        uploadKind: "media",
        hint: "Recommended 1200×630 px. Used when your site is shared on social/link previews.",
      },
      { key: "analyticsId", label: "External analytics ID (optional)", type: "text", half: true, hint: "Built-in analytics already run; only needed for GA/etc." },
    ],
  },
  {
    id: "contact",
    title: "F · Contact",
    icon: LuMail,
    accent: "text-amber-400",
    fields: [
      { key: "contactHeading", label: "Contact heading", type: "text", half: true },
      { key: "contactSubheading", label: "Contact sub-heading", type: "text", half: true },
      { key: "contactEmail", label: "Contact email (mailto)", type: "text", half: true },
      { key: "contactFormDestination", label: "Form destination email", type: "text", half: true, hint: "Where contact-form submissions are delivered" },
      { key: "availableFor", label: "“Available for” status line", type: "text" },
      { key: "showContactForm", label: "Show contact form", type: "toggle" },
    ],
  },
  {
    id: "controls",
    title: "G · Availability & Sections",
    icon: LuToggleRight,
    accent: "text-emerald-400",
    fields: [
      {
        key: "availabilityStatus",
        label: "Availability status",
        type: "select",
        half: true,
        hint: "Shown as a live badge in the About section",
        options: [
          { value: "available", label: "Available for hire" },
          { value: "freelance", label: "Open to freelance" },
          { value: "employed-open", label: "Employed · open to collabs" },
          { value: "not-looking", label: "Not currently looking" },
        ],
      },
      { key: "showAvailabilityBadge", label: "Show availability badge", type: "toggle", half: true },
      { key: "showProjects", label: "Show Projects section", type: "toggle", half: true },
      { key: "showExperience", label: "Show Experience section", type: "toggle", half: true },
      { key: "showSkills", label: "Show Skills section", type: "toggle", half: true },
      { key: "showArticles", label: "Show Articles / blog section", type: "toggle", half: true },
    ],
  },
  {
    id: "now",
    title: "H · “Now” page",
    icon: LuActivity,
    accent: "text-amber-400",
    fields: [
      {
        key: "nowText",
        label: "What you're up to now",
        type: "textarea",
        hint: "Shown at /now. Separate paragraphs with a blank line (e.g. working on / learning / open to).",
      },
      { key: "nowUpdatedAt", label: "Last updated label", type: "text", half: true, placeholder: "July 2026" },
    ],
  },
];

const inputClass =
  "w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none";

function statsOf(value: ConfigValue | undefined): SiteConfigStat[] {
  const stats = Array.isArray(value) ? (value as SiteConfigStat[]) : [];
  return [0, 1, 2].map((i) => ({ value: stats[i]?.value ?? "", label: stats[i]?.label ?? "" }));
}

function customLinkOf(value: ConfigValue | undefined): { label: string; url: string } {
  const v = value && typeof value === "object" && !Array.isArray(value) ? (value as { label?: string; url?: string }) : {};
  return { label: v.label ?? "", url: v.url ?? "" };
}

export function SettingsManager() {
  const [config, setConfig] = useState<ConfigState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({ identity: true });
  const [banners, setBanners] = useState<Record<string, { kind: "success" | "error"; text: string } | undefined>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const bannerTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const setBanner = useCallback((section: string, banner?: { kind: "success" | "error"; text: string }) => {
    setBanners((b) => ({ ...b, [section]: banner }));
    if (bannerTimers.current[section]) clearTimeout(bannerTimers.current[section]);
    if (banner) {
      bannerTimers.current[section] = setTimeout(() => {
        setBanners((b) => ({ ...b, [section]: undefined }));
      }, 5000);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/config", { cache: "no-store" });
        if (res.status === 401) throw new Error("Session expired — sign in again from the login page.");
        const data = (await res.json().catch(() => ({}))) as { config?: ConfigState; error?: string };
        if (!res.ok || !data.config) throw new Error(data.error ?? `Request failed (${res.status})`);
        if (!cancelled) setConfig(data.config);
      } catch (err) {
        if (!cancelled) setLoadError((err as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setValue = (key: string, value: ConfigValue) => {
    setConfig((c) => (c ? { ...c, [key]: value } : c));
  };

  const saveSection = async (section: SectionDef) => {
    if (!config) return;
    setSavingSection(section.id);
    setBanner(section.id, undefined);
    try {
      const values: Record<string, unknown> = {};
      for (const field of section.fields) values[field.key] = config[field.key];
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const data = (await res.json().catch(() => ({}))) as { config?: ConfigState; error?: string };
      if (!res.ok) {
        setBanner(section.id, { kind: "error", text: data.error ?? `Save failed (${res.status}).` });
        return;
      }
      if (data.config) setConfig(data.config);
      setBanner(section.id, { kind: "success", text: "Saved and published to the live site." });
    } catch (err) {
      setBanner(section.id, { kind: "error", text: (err as Error).message });
    } finally {
      setSavingSection(null);
    }
  };

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm font-medium text-red-300">
        {loadError}
      </div>
    );
  }

  if (!config) {
    return <p className="font-mono text-sm text-slate-400">LOADING CONFIG…</p>;
  }

  return (
    <div className="space-y-4">
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const isOpen = open[section.id] === true;
        const banner = banners[section.id];
        return (
          <section
            key={section.id}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur transition hover:border-amber-400/30"
          >
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [section.id]: !isOpen }))}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <span className="flex items-center gap-3">
                <Icon size={18} className={section.accent} aria-hidden />
                <span className="text-sm font-semibold uppercase tracking-[0.14em] text-white">{section.title}</span>
              </span>
              <LuChevronDown
                size={16}
                aria-hidden
                className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveSection(section);
                }}
                className="space-y-4 border-t border-white/10 px-5 py-5"
              >
                {banner && (
                  <div
                    role="status"
                    className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                      banner.kind === "error"
                        ? "border-red-400/30 bg-red-500/20 text-red-300"
                        : "border-emerald-400/30 bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {banner.kind === "error" ? <LuCircleAlert size={16} aria-hidden /> : <LuCheck size={16} aria-hidden />}
                    <span>{banner.text}</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {section.fields.map((field) => (
                    <SettingsField
                      key={field.key}
                      field={field}
                      value={config[field.key]}
                      onChange={(value) => setValue(field.key, value)}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={savingSection !== null}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-amber-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
                >
                  <LuCheck size={15} aria-hidden />
                  {savingSection === section.id ? "Saving…" : "Save"}
                </button>
              </form>
            )}
          </section>
        );
      })}
    </div>
  );
}

function FileField({
  field,
  value,
  onChange,
  wrapClass,
  labelEl,
  hintEl,
}: {
  field: FieldDef;
  value: ConfigValue | undefined;
  onChange: (value: ConfigValue) => void;
  wrapClass: string;
  labelEl: ReactNode;
  hintEl: ReactNode;
}) {
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const current = String(value ?? "");

  const upload = async (file: File) => {
    setUploading(true);
    setMsg(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", field.uploadKind ?? "media");
      body.append("label", field.label);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? `Upload failed (${res.status}).`);
      onChange(data.url);
      setMsg({ kind: "ok", text: "Uploaded and published to the live site." });
    } catch (err) {
      setMsg({ kind: "err", text: (err as Error).message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-2 ${wrapClass}`}>
      {labelEl}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={current}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/bhargava-teja-borra-resume.pdf"
          className={`${inputClass} flex-1 font-mono`}
        />
        {current && (
          <a
            href={current}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-200 transition hover:text-white"
          >
            View
          </a>
        )}
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-amber-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
          <LuUpload size={14} aria-hidden />
          {uploading ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept={field.accept}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {msg && <span className={`block text-xs ${msg.kind === "ok" ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</span>}
      {hintEl}
    </div>
  );
}

function SettingsField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: ConfigValue | undefined;
  onChange: (value: ConfigValue) => void;
}) {
  const wrapClass = field.half ? "" : "sm:col-span-2";
  const labelEl = (
    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-400">{field.label}</span>
  );
  const hintEl = field.hint ? <span className="block text-xs text-slate-400">{field.hint}</span> : null;

  if (field.type === "toggle") {
    return (
      <label className={`flex items-center gap-3 text-sm text-white ${wrapClass}`}>
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-amber-400"
        />
        {field.label}
      </label>
    );
  }

  if (field.type === "stats") {
    const stats = statsOf(value);
    return (
      <div className={`space-y-2 ${wrapClass}`}>
        {labelEl}
        {stats.map((stat, i) => (
          <div key={i} className="grid grid-cols-[7rem_1fr] gap-2">
            <input
              type="text"
              value={stat.value}
              placeholder={i === 0 ? "4+" : "Value"}
              onChange={(e) => {
                const next = [...stats];
                next[i] = { ...next[i], value: e.target.value };
                onChange(next);
              }}
              className={`${inputClass} font-mono`}
            />
            <input
              type="text"
              value={stat.label}
              placeholder={i === 0 ? "Years building cloud systems" : "Label"}
              onChange={(e) => {
                const next = [...stats];
                next[i] = { ...next[i], label: e.target.value };
                onChange(next);
              }}
              className={inputClass}
            />
          </div>
        ))}
        {hintEl}
      </div>
    );
  }

  if (field.type === "customLink") {
    const link = customLinkOf(value);
    return (
      <div className={`space-y-2 ${wrapClass}`}>
        {labelEl}
        <div className="grid grid-cols-[10rem_1fr] gap-2">
          <input
            type="text"
            value={link.label}
            placeholder="Label (e.g. Credly)"
            onChange={(e) => onChange({ ...link, label: e.target.value })}
            className={inputClass}
          />
          <input
            type="text"
            value={link.url}
            placeholder="https://…"
            onChange={(e) => onChange({ ...link, url: e.target.value })}
            className={inputClass}
          />
        </div>
        {hintEl}
      </div>
    );
  }

  if (field.type === "file") {
    return <FileField field={field} value={value} onChange={onChange} wrapClass={wrapClass} labelEl={labelEl} hintEl={hintEl} />;
  }

  if (field.type === "csv") {
    return (
      <label className={`block space-y-1 ${wrapClass}`}>
        {labelEl}
        <input
          type="text"
          value={Array.isArray(value) ? (value as string[]).join(", ") : ""}
          onChange={(e) =>
            onChange(
              e.target.value
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean),
            )
          }
          placeholder={field.placeholder}
          className={inputClass}
        />
        {hintEl}
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className={`block space-y-1 ${wrapClass}`}>
        {labelEl}
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900">
              {opt.label}
            </option>
          ))}
        </select>
        {hintEl}
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className={`block space-y-1 ${wrapClass}`}>
        {labelEl}
        <textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={field.placeholder}
          className={inputClass}
        />
        {hintEl}
      </label>
    );
  }

  // text / secret
  return (
    <label className={`block space-y-1 ${wrapClass}`}>
      {labelEl}
      <input
        type="text"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        autoComplete="off"
        spellCheck={false}
        className={`${inputClass} ${field.type === "secret" ? "font-mono" : ""}`}
      />
      {field.type === "secret" ? (
        <span className="block text-xs text-slate-400">
          Stored securely — shown masked with the last 4 characters. Paste a new value to replace it.
        </span>
      ) : (
        hintEl
      )}
    </label>
  );
}
