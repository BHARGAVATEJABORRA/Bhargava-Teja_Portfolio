/**
 * /api/likes — real, persisted likes for projects and articles (public).
 *
 * GET  ?type=project|article[&visitor=<id>] → { counts: {key: n}, liked: [keys] }
 * POST { type, key, visitorId, liked }      → { count }
 *
 * visitorId is an anonymous random token generated client-side (lib/use-likes.ts).
 * Lightly rate-limited per IP, same pattern as /api/track.
 */

import { NextResponse, type NextRequest } from "next/server";

import { getLikeCounts, getVisitorLikes, setLike, type LikeEntityType } from "@/lib/likes-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 10_000;
const MAX_PER_WINDOW = 30;
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

function parseType(value: unknown): LikeEntityType | null {
  return value === "project" || value === "article" ? value : null;
}

function parseVisitor(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z0-9-]{8,64}$/.test(value) ? value : null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const type = parseType(req.nextUrl.searchParams.get("type"));
  if (!type) return NextResponse.json({ error: "type must be project or article." }, { status: 400 });

  const visitor = parseVisitor(req.nextUrl.searchParams.get("visitor"));
  const [counts, liked] = await Promise.all([
    getLikeCounts(type),
    visitor ? getVisitorLikes(type, visitor) : Promise.resolve([]),
  ]);

  return NextResponse.json({ counts, liked }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (limited(clientKey(req))) return NextResponse.json({ error: "Slow down." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const type = parseType(body.type);
  const visitorId = parseVisitor(body.visitorId);
  const key = typeof body.key === "string" ? body.key.trim().slice(0, 200) : "";
  const liked = body.liked === true;

  if (!type || !visitorId || !key) {
    return NextResponse.json({ error: "type, key and visitorId are required." }, { status: 400 });
  }

  const count = await setLike(type, key, visitorId, liked);
  if (count === null) return NextResponse.json({ error: "Could not save like." }, { status: 500 });

  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
