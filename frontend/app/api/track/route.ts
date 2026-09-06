/**
 * /api/track — first-party, cookie-less analytics ingest (public).
 *
 * Accepts a tiny JSON beacon from the site: page views and named events.
 * No PII: the sessionId is an anonymous per-visit token generated client-side.
 * Lightly rate-limited per IP to keep noise/abuse down.
 */

import { NextResponse, type NextRequest } from "next/server";

import { recordAnalytics } from "@/lib/insights-store";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { readJsonObject, requestErrorResponse } from "@/lib/request-security";

const EVENTS = new Set([
  "header_nav_click", "command_palette_open", "theme_change", "dock_toggle", "login_icon_click",
  "social_icon_click", "ai_placeholder_click", "ai_companion_query", "ai_companion_voice_start",
  "hero_primary_cta_click", "hero_secondary_cta_click", "flagship_case_study_click", "project_card_click",
  "project_click", "resume_packet_click", "resume_download", "dock_link_click", "experience_tab_change",
  "cert_verify_click", "command_used", "contact_submit_success", "contact_submit_error",
]);
const META_KEYS = new Set(["source", "target", "platform", "length", "command", "command_id", "command_group", "topic", "tab", "label", "href", "title", "organization"]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 10_000;
const MAX_PER_WINDOW = 40;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limit = await rateLimit(`track:${clientIp(req)}`, {
    limit: MAX_PER_WINDOW,
    windowMs: WINDOW_MS,
  });
  if (!limit.allowed) return NextResponse.json({ ok: true }, { status: 202 });

  let body: Record<string, unknown>;
  try {
    body = await readJsonObject(req, 8192);
  } catch (error) {
    return requestErrorResponse(error);
  }

  const type = body.type === "event" ? "event" : "pageview";
  if (body.type !== "event" && body.type !== "pageview") return NextResponse.json({ error: "Invalid event type." }, { status: 400 });
  if (type === "event" && (typeof body.name !== "string" || !EVENTS.has(body.name))) return NextResponse.json({ error: "Unknown event." }, { status: 400 });
  const path = typeof body.path === "string" && body.path.startsWith("/") && !body.path.startsWith("//") ? body.path.split(/[?#]/)[0].slice(0, 500) : null;
  const name = type === "pageview" ? path ?? "/" : String(body.name);
  // Retain only the source origin, never query strings or private paths.
  let referrer: string | null = null;
  try {
    const source = new URL(String(body.referrer));
    if (["http:", "https:"].includes(source.protocol) && source.origin !== req.nextUrl.origin) referrer = source.origin;
  } catch { /* absent/invalid referrer */ }
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : null;
  const meta = body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
    ? Object.fromEntries(Object.entries(body.meta).filter(([key, value]) => META_KEYS.has(key) && ["string", "number", "boolean"].includes(typeof value))
        .map(([key, value]) => [key, typeof value === "string" ? value.split(/[?#]/)[0].slice(0, 300) : value]))
    : undefined;
  const global = await rateLimit("track:global", { limit: 5000, windowMs: 3_600_000 });
  if (!global.allowed) return NextResponse.json({ ok: true }, { status: 202 });

  await recordAnalytics({ type, name, path, referrer, sessionId, meta });
  return NextResponse.json({ ok: true }, { status: 202 });
}
