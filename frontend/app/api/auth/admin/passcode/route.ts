import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { ADMIN_SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/admin-session";
import { clearLoginFailures, clientIp, loginLockStatus, recordLoginFailure } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dev-only fallback so `npm run dev` works out of the box. In production
// (Vercel / NODE_ENV=production) ADMIN_PASSCODE MUST be set or login is
// refused — the real passcode never lives in this public repo.
const DEV_ONLY_PASSCODE = "dev-passcode-change-me";

function getExpectedPasscode(): string | null {
  const configured = process.env.ADMIN_PASSCODE?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) return null;
  return DEV_ONLY_PASSCODE;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  // Brute-force lockout: refuse before even comparing once too many recent
  // failures have accrued (globally or from this IP).
  const lock = await loginLockStatus(ip);
  if (lock.locked) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts. Try again in ${lock.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(lock.retryAfterSeconds) } },
    );
  }

  const expected = getExpectedPasscode();
  if (!expected) {
    console.error("[passcode] ADMIN_PASSCODE is not configured in production — refusing login.");
    return NextResponse.json({ ok: false, error: "Admin login is not configured." }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as { passcode?: string };
  const provided = String(body.passcode ?? "");

  if (!provided || !safeEqual(provided, expected)) {
    await recordLoginFailure(ip);
    // Small constant delay to further slow scripted guessing.
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ ok: false, error: "Incorrect passcode." }, { status: 401 });
  }

  await clearLoginFailures(ip);
  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
