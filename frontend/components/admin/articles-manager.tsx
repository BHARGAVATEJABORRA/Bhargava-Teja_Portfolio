"use client";

import { CollectionManager, type FieldSpec } from "@/components/admin/collection-manager";
import type { ArticleDto } from "@/lib/content-store";

const fields: FieldSpec[] = [
  { key: "title", label: "Title", kind: "text", required: true },
  { key: "slug", label: "Slug", kind: "text", required: true, half: true, hint: "lowercase-with-hyphens; also the /articles/<slug> URL" },
  { key: "source", label: "Kicker / source", kind: "text", half: true, placeholder: "Cloud Cost · FinOps" },
  { key: "excerpt", label: "Excerpt", kind: "textarea", required: true },
  { key: "tagline", label: "Tagline", kind: "text" },
  { key: "body", label: "Body", kind: "textarea" },
  { key: "premise", label: "Premise", kind: "textarea", required: true },
  { key: "takeaway", label: "Takeaway", kind: "textarea", required: true },
  { key: "publishedAt", label: "Published", kind: "text", required: true, half: true, placeholder: "March 2025" },
  { key: "readTime", label: "Read time", kind: "text", required: true, half: true, placeholder: "8 min read" },
  { key: "href", label: "Link (href)", kind: "text", half: true, placeholder: "# or https://…" },
  { key: "accent", label: "Accent color", kind: "text", half: true, placeholder: "#fcbc1d" },
  { key: "likes", label: "Likes", kind: "number", half: true },
  { key: "tags", label: "Tags", kind: "csv", half: true, hint: "Comma-separated" },
  { key: "isReal", label: "Real published post (unchecked = sample)", kind: "checkbox", half: true },
  { key: "isExternal", label: "External link", kind: "checkbox", half: true },
];

export function ArticlesManager() {
  return (
    <CollectionManager<ArticleDto>
      endpoint="/api/admin/articles"
      entityLabel="article"
      fields={fields}
      itemTitle={(a) => a.title}
      itemSubtitle={(a) => `${a.publishedAt} · ${a.readTime}${a.isReal ? "" : " · sample"}`}
    />
  );
}
