import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { MediaLibrary } from "@/components/admin/media-library";

export const metadata: Metadata = { title: "Admin · Media", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminMediaPage() {
  return (
    <AdminShell title="Media library" description="Upload and organize screenshots and assets, then copy their URLs into project cards, articles, or settings.">
      <MediaLibrary />
    </AdminShell>
  );
}
