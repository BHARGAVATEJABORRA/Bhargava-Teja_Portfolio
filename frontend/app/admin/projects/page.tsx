import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { ProjectsManager } from "@/components/admin/projects-manager";

export const metadata: Metadata = { title: "Admin · Projects", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminProjectsPage() {
  return (
    <AdminShell title="Projects" description="Create, edit, and delete the project case studies shown on the public portfolio.">
      <ProjectsManager />
    </AdminShell>
  );
}
