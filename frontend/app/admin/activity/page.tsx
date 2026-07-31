"use client";

import { useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { ChangeHistory } from "@/components/admin/change-history";

const FILTERS = [
  { value: "", label: "All" },
  { value: "project", label: "Projects" },
  { value: "experience", label: "Experience" },
  { value: "skill", label: "Skills" },
  { value: "article", label: "Articles" },
  { value: "settings", label: "Settings" },
  { value: "resume", label: "Resume" },
  { value: "media", label: "Media" },
] as const;

export default function AdminActivityPage() {
  const [filter, setFilter] = useState<string>("");

  return (
    <AdminShell
      title="Activity log"
      description="A complete, append-only history of every change you've made in the admin panel — what changed, and when."
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
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

      <ChangeHistory entity={filter || undefined} limit={200} title={filter ? `${filter} history` : "All changes"} />
    </AdminShell>
  );
}
