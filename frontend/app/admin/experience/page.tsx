import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { ExperienceManager } from "@/components/admin/experience-manager";

export const metadata: Metadata = { title: "Admin · Experience", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminExperiencePage() {
  return (
    <AdminShell title="Experience" description="Manage work history, education, and certifications shown on the public portfolio.">
      <ExperienceManager />
    </AdminShell>
  );
}
