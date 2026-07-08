import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { ArticlesManager } from "@/components/admin/articles-manager";

export const metadata: Metadata = { title: "Admin · Articles", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminArticlesPage() {
  return (
    <AdminShell title="Articles" description="Manage the writing/resources deck. Sample stories stay flagged until you mark them real.">
      <ArticlesManager />
    </AdminShell>
  );
}
