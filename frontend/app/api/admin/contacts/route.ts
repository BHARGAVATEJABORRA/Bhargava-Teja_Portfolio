/**
 * /api/admin/contacts — the contact-form inbox.
 * GET → submissions (optionally filtered by ?status=new|read|replied|spam|all).
 */

import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { listContactSubmissions } from "@/lib/insights-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const status = req.nextUrl.searchParams.get("status") ?? "all";
  try {
    const items = await listContactSubmissions({ status });
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[admin-contacts]", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
