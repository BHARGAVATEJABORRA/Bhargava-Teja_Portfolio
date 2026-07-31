import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { ContactManager } from "@/components/admin/contact-manager";

export const metadata: Metadata = { title: "Admin · Inbox", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminInboxPage() {
  return (
    <AdminShell title="Inbox" description="Contact-form submissions. Mark read/replied, tag by type, or clear spam — all stored on your own database.">
      <ContactManager />
    </AdminShell>
  );
}
