"use client";

import { CollectionManager, type FieldSpec } from "@/components/admin/collection-manager";
import type { SkillDto } from "@/lib/content-store";

const fields: FieldSpec[] = [
  { key: "category", label: "Category", kind: "text", required: true, half: true, hint: "Skills group by this, e.g. Cloud/DevOps" },
  { key: "name", label: "Skill name", kind: "text", required: true, half: true },
  { key: "iconKey", label: "Icon key", kind: "text", required: true, half: true, hint: "react-icons key, e.g. SiDocker or LuDatabase" },
  { key: "brandColor", label: "Brand color", kind: "text", required: true, half: true, placeholder: "#2496ED" },
  { key: "keywords", label: "Keywords", kind: "csv", hint: "Comma-separated search keywords (optional)" },
];

export function SkillsManager() {
  return (
    <CollectionManager<SkillDto>
      endpoint="/api/admin/skills"
      entityLabel="skill"
      fields={fields}
      itemTitle={(s) => s.name}
      itemSubtitle={(s) => s.category}
    />
  );
}
