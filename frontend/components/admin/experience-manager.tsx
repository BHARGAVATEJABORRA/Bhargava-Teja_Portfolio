"use client";

import { CollectionManager, type FieldSpec } from "@/components/admin/collection-manager";
import type { ExperienceDto } from "@/lib/content-store";

const fields: FieldSpec[] = [
  {
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
  },
  { key: "organization", label: "Organization", kind: "text", required: true, half: true },
  { key: "title", label: "Title", kind: "text", required: true, half: true },
  { key: "period", label: "Period", kind: "text", required: true, half: true, placeholder: "Jul 2025 - Present" },
  { key: "location", label: "Location", kind: "text", half: true, placeholder: "Dallas, TX" },
  { key: "href", label: "Link (href)", kind: "text", half: true, placeholder: "https://…" },
  { key: "highlights", label: "Highlights", kind: "lines", hint: "One bullet per line" },
  { key: "badgeUrl", label: "Badge image URL (certifications)", kind: "text", half: true },
  { key: "verifyUrl", label: "Verification URL (certifications)", kind: "text", half: true },
  { key: "brandIconKey", label: "Brand icon key", kind: "text", half: true, hint: "react-icons key, e.g. SiAmazonwebservices" },
  { key: "brandColor", label: "Brand color", kind: "text", half: true, placeholder: "#FF9900" },
];

const KIND_ORDER: Record<ExperienceDto["kind"], number> = { work: 0, education: 1, certifications: 2 };

const KIND_BADGE: Record<ExperienceDto["kind"], { label: string; className: string }> = {
  work: { label: "WORK", className: "border-amber-400/30 bg-amber-400/15 text-amber-400" },
  education: { label: "EDUCATION", className: "border-blue-400/30 bg-blue-400/15 text-blue-400" },
  certifications: { label: "CERT", className: "border-emerald-400/30 bg-emerald-400/15 text-emerald-400" },
};

/** "Jul 2025 - Present" → sortable recency key (Present > later start dates > older). */
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

function sortExperience(items: ExperienceDto[]): ExperienceDto[] {
  return [...items].sort((a, b) => {
    const byKind = (KIND_ORDER[a.kind] ?? 3) - (KIND_ORDER[b.kind] ?? 3);
    if (byKind !== 0) return byKind;
    return periodSortKey(b.period) - periodSortKey(a.period); // period desc within kind
  });
}

export function ExperienceManager() {
  return (
    <CollectionManager<ExperienceDto>
      endpoint="/api/admin/experiences"
      entityLabel="experience entry"
      fields={fields}
      itemTitle={(e) => `${e.title} — ${e.organization}`}
      itemSubtitle={(e) => e.period}
      itemBadge={(e) => {
        const badge = KIND_BADGE[e.kind] ?? KIND_BADGE.work;
        return (
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.14em] ${badge.className}`}
          >
            {badge.label}
          </span>
        );
      }}
      sortItems={sortExperience}
    />
  );
}
