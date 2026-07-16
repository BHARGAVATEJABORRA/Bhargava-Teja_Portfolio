/**
 * /api/admin/passkeys — manage the site owner's enrolled passkeys.
 *
 * GET    → list enrolled passkeys (id + createdAt only; never the public key).
 * DELETE → remove one passkey by id (?id=<base64url>). "Forget this device."
 *
 * Admin-gated (under /api/admin, checked again here). Enrollment itself happens
 * through /api/auth/webauthn/register/* which is also admin-gated.
 */

import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { recordChange } from "@/lib/change-log";
import { deleteCredential, getCredentials } from "@/lib/webauthn-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const creds = await getCredentials();
  return NextResponse.json({
    passkeys: creds.map((c) => ({ id: c.id, createdAt: c.createdAt })),
  });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Missing passkey id." }, { status: 400 });

  try {
    await deleteCredential(id);
    await recordChange({
      entity: "settings",
      action: "delete",
      field: "passkey",
      summary: "Removed an enrolled passkey",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin-passkeys] delete", err);
    return NextResponse.json({ error: "Could not remove that passkey." }, { status: 500 });
  }
}
