/**
 * /api/admin/history — the admin activity log (append-only change history).
 *
 * GET → most-recent-first list of changes. Query params:
 *   ?entity=project|experience|skill|article|settings|resume|media  (filter)
 *   ?limit=1..500 (default 100)
 *   ?before=<ms epoch> (pagination cursor — return entries older than this)
 */

import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { countChanges, listChanges, type ChangeEntity } from "@/lib/change-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENTITIES: ChangeEntity[] = ["project", "experience", "skill", "article", "settings", "resume", "media"];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const params = req.nextUrl.searchParams;
  const entityParam = params.get("entity");
  const entity = entityParam && (ENTITIES as string[]).includes(entityParam) ? (entityParam as ChangeEntity) : undefined;
  const limit = Number(params.get("limit")) || undefined;
  const before = Number(params.get("before")) || undefined;

  try {
    const [items, total] = await Promise.all([
      listChanges({ entity, limit, before }),
      countChanges(),
    ]);
    return NextResponse.json({ items, total });
  } catch (err) {
    console.error("[admin-history]", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
