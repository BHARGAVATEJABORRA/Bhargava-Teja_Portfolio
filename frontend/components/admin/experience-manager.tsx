"use client";

import { useState } from "react";
import { LuBriefcase, LuGraduationCap, LuBadgeCheck } from "react-icons/lu";

import { CollectionManager, type FieldSpec } from "@/components/admin/collection-manager";
import type { ExperienceDto } from "@/lib/content-store";

type Kind = "work" | "education" | "certifications";

// A hidden-ish kind field keeps the payload valid; it's pre-set per sub-section
// via defaultValues and can be changed to move an entry between sections.
const kindField: FieldSpec = {
  key: "kind",
  label: "Section",
  kind: "select",
  required: true,
  half: true,
  options: [
    { value: "work", label: "Work" },
    { value: "education", label: "Education" },
    { value: "certifications", label: "Certifications" },
  ],
};

const commonFields: FieldSpec[] = [
  { key: "organization", label: "Organization", kind: "text", required: true, half: true },
  { key: "title", label: "Title", kind: "text", required: true, half: true },
  { key: "period", label: "Period", kind: "text", required: true, half: true, placeholder: "Jul 2025 - Present" },
  { key: "location", label: "Location", kind: "text", half: true, placeholder: "Dallas, TX" },
  { key: "href", label: "Link (href)", kind: "text", half: true, placeholder: "https://…" },
];

const workFields: FieldSpec[] = [kindField, ...commonFields, { key: "highlights", label: "Highlights", kind: "lines", hint: "One bullet per line" }];

const educationFields: FieldSpec[] = [kindField, ...commonFields, { key: "highlights", label: "Highlights", kind: "lines", hint: "One bullet per line" }];

const certFields: FieldSpec[] = [
  kindField,
  { key: "organization", label: "Issuer", kind: "text", required: true, half: true, placeholder: "Amazon Web Services" },
  { key: "title", label: "Certification", kind: "text", required: true, half: true },
  { key: "period", label: "Issued", kind: "text", required: true, half: true, placeholder: "2024" },
  { key: "badgeUrl", label: "Badge image", kind: "image", hint: "Credly badge image; recommended square (e.g. 300×300)." },
  { key: "verifyUrl", label: "Verification URL", kind: "text", half: true, placeholder: "https://www.credly.com/…" },
  { key: "brandIconKey", label: "Brand icon key", kind: "text", half: true, hint: "react-icons key, e.g. SiAmazonwebservices" },
  { key: "brandColor", label: "Brand color", kind: "text", half: true, placeholder: "#FF9900" },
];

const TABS: { kind: Kind; label: string; icon: typeof LuBriefcase; endpointLabel: string; fields: FieldSpec[] }[] = [
  { kind: "work", label: "Work", icon: LuBriefcase, endpointLabel: "work entry", fields: workFields },
  { kind: "education", label: "Education", icon: LuGraduationCap, endpointLabel: "education entry", fields: educationFields },
  { kind: "certifications", label: "Certification", icon: LuBadgeCheck, endpointLabel: "certification", fields: certFields },
];

/** "Jul 2025 - Present" → sortable recency key. */
function periodSortKey(period: string): number {
  if (/present|current/i.test(period)) return Number.MAX_SAFE_INTEGER;
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const matches = [...period.toLowerCase().matchAll(/([a-z]{3})[a-z]*\s+(\d{4})/g)];
  const last = matches[matches.length - 1];
  if (!last) {
    const year = period.match(/\d{4}/);
    return year ? Number(year[0]) * 12 : 0;
  }
  const month = months.indexOf(last[1]);
  return Number(last[2]) * 12 + (month >= 0 ? month : 0);
}

function sortByRecency(items: ExperienceDto[]): ExperienceDto[] {
  return [...items].sort((a, b) => periodSortKey(b.period) - periodSortKey(a.period));
}

export function ExperienceManager() {
  const [active, setActive] = useState<Kind>("work");
  const tab = TABS.find((t) => t.kind === active) ?? TABS[0];

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Experience sub-sections" className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = t.kind === active;
          return (
            <button
              key={t.kind}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(t.kind)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                isActive
                  ? "bg-[var(--color-accent)] text-black"
                  : "border tint-border-bd-72 tint-card-bg-56 text-[var(--color-ink)] hover:opacity-80"
              }`}
            >
              <Icon size={15} aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      <CollectionManager<ExperienceDto>
        key={tab.kind}
        endpoint="/api/admin/experiences"
        entityLabel={tab.endpointLabel}
        fields={tab.fields}
        defaultValues={{ kind: tab.kind }}
        filterItems={(e) => e.kind === tab.kind}
        sortItems={sortByRecency}
        itemTitle={(e) => `${e.title} — ${e.organization}`}
        itemSubtitle={(e) => e.period}
      />
    </div>
  );
}
