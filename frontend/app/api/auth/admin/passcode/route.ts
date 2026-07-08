import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { ADMIN_SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dev default so the fallback works out of the box. Override with ADMIN_PASSCODE.
const DEFAULT_PASSCODE = "admin1234";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { passcode?: string };
  const provided = String(body.passcode ?? "");
  const expected = process.env.ADMIN_PASSCODE?.trim() || DEFAULT_PASSCODE;

  if (!provided || !safeEqual(provided, expected)) {
    return NextResponse.json({ ok: false, error: "Incorrect passcode." }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
