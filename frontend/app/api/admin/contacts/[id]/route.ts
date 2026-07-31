/**
 * /api/admin/contacts/[id] — update (status/tag) or delete one submission.
 */

import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { recordChange } from "@/lib/change-log";
import { deleteContactSubmission, updateContactSubmission } from "@/lib/insights-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["new", "read", "replied", "spam"]);

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const patch: { status?: string; tag?: string | null } = {};
  if (typeof body.status === "string" && STATUSES.has(body.status)) patch.status = body.status;
  if (body.tag === null || typeof body.tag === "string") patch.tag = (body.tag as string | null) || null;
  if (patch.status === undefined && patch.tag === undefined) {
    return NextResponse.json({ error: "Provide status and/or tag." }, { status: 400 });
  }

  const ok = await updateContactSubmission(id, patch);
  if (!ok) return NextResponse.json({ error: "Update failed." }, { status: 500 });
  await recordChange({
    entity: "settings",
    action: "update",
    entityId: id,
    field: "contact",
    summary: `Contact message ${patch.status ? `marked ${patch.status}` : "tagged"}`,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const ok = await deleteContactSubmission(id);
  if (!ok) return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  await recordChange({ entity: "settings", action: "delete", entityId: id, field: "contact", summary: "Deleted a contact message" });
  return NextResponse.json({ ok: true });
}
