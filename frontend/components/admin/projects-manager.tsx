"use client";

import { CollectionManager, type FieldSpec } from "@/components/admin/collection-manager";
import type { ProjectDto } from "@/lib/content-store";

const fields: FieldSpec[] = [
  { key: "title", label: "Title", kind: "text", required: true },
  { key: "category", label: "Category", kind: "text", required: true, half: true, placeholder: "Cloud Infrastructure" },
  { key: "role", label: "Role", kind: "text", required: true, half: true, placeholder: "Software Engineer" },
  { key: "timeframe", label: "Timeframe", kind: "text", required: true, half: true, placeholder: "Jul 2025 - Present" },
  {
    key: "linkState",
    label: "Link state",
    kind: "select",
    half: true,
    options: [
      { value: "on-request", label: "On request" },
      { value: "configured", label: "Configured (public link)" },
    ],
  },
  { key: "problem", label: "Problem", kind: "textarea", required: true },
  { key: "approach", label: "Approach", kind: "textarea", required: true },
  { key: "outcome", label: "Outcome", kind: "textarea", required: true },
  { key: "stack", label: "Stack", kind: "csv", hint: "Comma-separated, e.g. AWS, Lambda, Terraform" },
  { key: "techStack", label: "Tech stack (short badges)", kind: "csv", hint: "Comma-separated short list shown on cards" },
  { key: "metrics", label: "Metrics", kind: "metrics", hint: "One per line as: value | label — e.g. 35% | Cost Reduction" },
  { key: "href", label: "Card link (href)", kind: "text", half: true, placeholder: "#contact" },
  { key: "liveUrl", label: "Live URL", kind: "text", half: true, placeholder: "https://…" },
  { key: "repoUrl", label: "Repo URL", kind: "text", half: true, placeholder: "https://github.com/…" },
  {
    key: "imageUrl",
    label: "Card image",
    kind: "image",
    hint: "Recommended 1200×800 px (3:2 landscape), PNG/JPG/WebP under 1 MB. Leave empty to keep the accent-glow placeholder.",
  },
  { key: "imageAlt", label: "Image alt text", kind: "text", half: true, placeholder: "Short description of the image" },
];

export function ProjectsManager() {
  return (
    <CollectionManager<ProjectDto>
      endpoint="/api/admin/projects"
      entityLabel="project"
      fields={fields}
      itemTitle={(p) => p.title}
      itemSubtitle={(p) => `${p.category} · ${p.timeframe}`}
    />
  );
}
