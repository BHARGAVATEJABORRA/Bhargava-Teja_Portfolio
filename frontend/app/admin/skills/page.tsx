import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { SkillsManager } from "@/components/admin/skills-manager";

export const metadata: Metadata = { title: "Admin · Skills", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminSkillsPage() {
  return (
    <AdminShell title="Skills" description="Manage the skill chips shown in the skills section, grouped by category.">
      <SkillsManager />
    </AdminShell>
  );
}
