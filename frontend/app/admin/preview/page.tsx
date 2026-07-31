import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = { title: "Admin · Preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminPreviewPage() {
  return (
    <AdminShell
      title="Live preview"
      description="The public portfolio, embedded. Content edits publish immediately; in dev the page below hot-reloads on the next refresh."
    >
      <div className="surface-panel overflow-hidden rounded-2xl">
        <iframe src="/" title="Public portfolio preview" className="h-[75vh] w-full border-0" />
      </div>
    </AdminShell>
  );
}
