/**
 * /api/track — first-party, cookie-less analytics ingest (public).
 *
 * Accepts a tiny JSON beacon from the site: page views and named events.
 * No PII: the sessionId is an anonymous per-visit token generated client-side.
 * Lightly rate-limited per IP to keep noise/abuse down.
 */

import { NextResponse, type NextRequest } from "next/server";

import { recordAnalytics } from "@/lib/insights-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 10_000;
const MAX_PER_WINDOW = 40;
const hits = new Map<string, number[]>();

function limited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (limited(clientKey(req))) return NextResponse.json({ ok: true }, { status: 202 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const type = body.type === "event" ? "event" : "pageview";
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : type === "pageview" ? "/" : "unknown";
  const path = typeof body.path === "string" ? body.path : null;
  const referrer =
    typeof body.referrer === "string" && body.referrer && !body.referrer.includes(req.headers.get("host") ?? "@@")
      ? body.referrer
      : null;
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : null;
  const meta = body.meta && typeof body.meta === "object" ? body.meta : undefined;

  await recordAnalytics({ type, name, path, referrer, sessionId, meta });
  return NextResponse.json({ ok: true }, { status: 202 });
}
