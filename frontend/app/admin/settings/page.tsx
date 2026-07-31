import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsManager } from "@/components/admin/settings-manager";

export const metadata: Metadata = { title: "Admin · Settings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <AdminShell
      title="Settings"
      description="Site-wide configuration: identity, hero and about copy, social links, AI companion, Spotify, metadata, and contact. Saves publish straight to the live site."
    >
      <SettingsManager />
    </AdminShell>
  );
}
