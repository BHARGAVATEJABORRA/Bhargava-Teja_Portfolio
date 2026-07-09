/**
 * /api/admin/ai-conversations — recent AI companion Q&A transcript.
 */

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { listAiConversations } from "@/lib/insights-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const items = await listAiConversations(100);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[admin-ai-conversations]", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
